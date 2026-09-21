import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const asyncRoute = (fn) => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
const issueToken = (user) => jwt.sign({ id:user.id, role:user.role, username:user.username }, JWT_SECRET, { expiresIn:'8h' });

function auth(req,res,next){
  const token=req.cookies.access_token;
  if(!token) return res.status(401).json({error:'Authentication required'});
  try { req.user=jwt.verify(token,JWT_SECRET); next(); } catch { return res.status(401).json({error:'Session expired'}); }
}
function allow(...roles){ return (req,res,next)=> roles.includes(req.user.role) ? next() : res.status(403).json({error:'Insufficient permissions'}); }
function parseDate(v){ const d=new Date(v); if(Number.isNaN(d.getTime())) throw new Error('Invalid date'); return d; }
const userSchema=z.object({name:z.string().min(2),username:z.string().min(3),password:z.string().min(6).optional(),role:z.enum(['ADMIN','MANAGER','STAFF']),status:z.enum(['ACTIVE','INACTIVE']).default('ACTIVE')});

app.get('/api/health',(req,res)=>res.json({ok:true,service:'sugam-erp-api'}));

app.post('/api/auth/login', asyncRoute(async (req,res)=>{
  const {username,password}=z.object({username:z.string().min(1),password:z.string().min(1)}).parse(req.body);
  const user=await prisma.user.findUnique({where:{username}});
  if(!user || user.status!=='ACTIVE' || !(await bcrypt.compare(password,user.passwordHash))) return res.status(401).json({error:'Invalid username or password'});
  res.cookie('access_token',issueToken(user),{httpOnly:true,sameSite:'none',secure:process.env.NODE_ENV==='production',maxAge:8*60*60*1000});
  res.json({user:{id:user.id,name:user.name,username:user.username,role:user.role,status:user.status}});
}));
app.post('/api/auth/logout',(req,res)=>{res.clearCookie('access_token',{httpOnly:true,sameSite:'none'});res.json({ok:true});});
app.get('/api/auth/me',auth,asyncRoute(async(req,res)=>{const user=await prisma.user.findUnique({where:{id:req.user.id},select:{id:true,name:true,username:true,role:true,status:true}});if(!user||user.status!=='ACTIVE')return res.status(401).json({error:'Inactive user'});res.json({user});}));

app.get('/api/meta',auth,asyncRoute(async(req,res)=>res.json({
  routes: await prisma.route.findMany({
  where: {
    status: 'ACTIVE'
  },
  orderBy: {
    name: 'asc'
  }
}), vehicles:await prisma.vehicle.findMany({orderBy:{regNo:'asc'}}), clients:await prisma.client.findMany({orderBy:{name:'asc'}}), drivers:await prisma.driver.findMany({orderBy:{name:'asc'}}), cleaners:await prisma.cleaner.findMany({orderBy:{name:'asc'}}), expenseTypes:await prisma.expenseType.findMany({orderBy:{name:'asc'}})
})));

// Generic settings CRUD
// Settings CRUD
const modelMap = {
  routes: 'route',
  vehicles: 'vehicle',
  clients: 'client',
  drivers: 'driver',
  cleaners: 'cleaner',
  expenseTypes: 'expenseType'
};

function buildSettingsData(resource, payload, isUpdate = false) {
  const status = payload.status || 'ACTIVE';

  switch (resource) {
    case 'routes':
      return {
        name: payload.name,
        code: payload.code || null,
        status
      };

    case 'vehicles':
      return {
        regNo: payload.regNo,
        label: payload.label || null,
        status
      };

    case 'clients':
    case 'drivers':
    case 'cleaners':
      return {
        name: payload.name,
        phone: payload.phone || null,
        status
      };

    case 'expenseTypes':
      return {
        name: payload.name,
        status
      };

    default:
      throw new Error('Unknown resource');
  }
}

app.get(
  '/api/settings/:resource',
  auth,
  asyncRoute(async (req, res) => {
    const { resource } = req.params;
    const model = modelMap[resource];

    if (!model) {
      return res.status(404).json({
        error: 'Unknown resource'
      });
    }

    const rows = await prisma[model].findMany({
      orderBy: { id: 'desc' }
    });

    res.json(rows);
  })
);

app.post(
  '/api/settings/:resource',
  auth,
  allow('ADMIN', 'MANAGER'),
  asyncRoute(async (req, res) => {
    const { resource } = req.params;
    const model = modelMap[resource];

    if (!model) {
      return res.status(404).json({
        error: 'Unknown resource'
      });
    }

    const data = buildSettingsData(
      resource,
      req.body
    );

    const record = await prisma[model].create({
      data
    });

    res.status(201).json(record);
  })
);

app.patch(
  '/api/settings/:resource/:id',
  auth,
  allow('ADMIN', 'MANAGER'),
  asyncRoute(async (req, res) => {
    const { resource, id } = req.params;
    const model = modelMap[resource];

    if (!model) {
      return res.status(404).json({
        error: 'Unknown resource'
      });
    }

    const data = buildSettingsData(
      resource,
      req.body,
      true
    );

    const record = await prisma[model].update({
      where: {
        id: Number(id)
      },
      data
    });

    res.json(record);
  })
);

app.delete(
  '/api/settings/:resource/:id',
  auth,
  allow('ADMIN'),
  asyncRoute(async (req, res) => {
    const { resource, id } = req.params;
    const model = modelMap[resource];
    const recordId = Number(id);

    if (!model) {
      return res.status(404).json({
        error: 'Unknown resource'
      });
    }

    // Routes cannot be deleted if they are used by trips
    if (resource === 'routes') {
      const tripCount = await prisma.trip.count({
        where: {
          routeId: recordId
        }
      });

      if (tripCount > 0) {
        return res.status(409).json({
          error: `This route is being used by ${tripCount} trip(s). Deactivate the route instead of deleting it.`
        });
      }
    }

    await prisma[model].delete({
      where: {
        id: recordId
      }
    });

    res.status(204).end();
  })
);

// Users CRUD
app.get('/api/users',auth,allow('ADMIN','MANAGER'),asyncRoute(async(req,res)=>res.json(await prisma.user.findMany({orderBy:{id:'desc'},select:{id:true,name:true,username:true,role:true,status:true,createdAt:true}}))));
app.post('/api/users',auth,allow('ADMIN'),asyncRoute(async(req,res)=>{const p=userSchema.parse(req.body);const hash=await bcrypt.hash(p.password||'changeme123',12);const user=await prisma.user.create({data:{name:p.name,username:p.username,passwordHash:hash,role:p.role,status:p.status}});res.status(201).json({id:user.id,name:user.name,username:user.username,role:user.role,status:user.status});}));
app.patch('/api/users/:id',auth,allow('ADMIN'),asyncRoute(async(req,res)=>{const p=userSchema.partial().parse(req.body);const data={};if(p.name!==undefined)data.name=p.name;if(p.username!==undefined)data.username=p.username;if(p.role!==undefined)data.role=p.role;if(p.status!==undefined)data.status=p.status;if(p.password)data.passwordHash=await bcrypt.hash(p.password,12);const user=await prisma.user.update({where:{id:Number(req.params.id)},data});res.json({id:user.id,name:user.name,username:user.username,role:user.role,status:user.status});}));
app.delete('/api/users/:id',auth,allow('ADMIN'),asyncRoute(async(req,res)=>{if(Number(req.params.id)===req.user.id)return res.status(400).json({error:'You cannot delete the current admin'});await prisma.user.delete({where:{id:Number(req.params.id)}});res.status(204).end();}));

app.post('/api/trips',auth,asyncRoute(async(req,res)=>{
  const p=req.body; const amount=Number(p.distanceKm||0)*Number(p.ratePerKm||0); const expenseTotal=['diesel','driverSalary','cleanerSalary','toll','waterBottle','parking','adBlue','other'].reduce((s,k)=>s+Number(p[k]||0),0);
  const trip=await prisma.trip.create({data:{tripDate:parseDate(p.tripDate),routeId:Number(p.routeId),vehicleId:Number(p.vehicleId),clientId:Number(p.clientId),driverId:p.driverId?Number(p.driverId):null,cleanerId:p.cleanerId?Number(p.cleanerId):null,distanceKm:Number(p.distanceKm||0),ratePerKm:Number(p.ratePerKm||0),amount, diesel:Number(p.diesel||0),driverSalary:Number(p.driverSalary||0),cleanerSalary:Number(p.cleanerSalary||0),toll:Number(p.toll||0),waterBottle:Number(p.waterBottle||0),parking:Number(p.parking||0),adBlue:Number(p.adBlue||0),other:Number(p.other||0),otherNote:p.otherNote||null,halt:Boolean(p.halt),createdById:req.user.id},include:{route:true,vehicle:true,client:true}});res.status(201).json({...trip,profit:amount-expenseTotal});
}));
app.get('/api/trips',auth,asyncRoute(async(req,res)=>{const where={};if(req.query.month){const [y,m]=req.query.month.split('-').map(Number);where.tripDate={gte:new Date(y,m-1,1),lt:new Date(y,m,1)}};if(req.query.vehicleId)where.vehicleId=Number(req.query.vehicleId);if(req.query.clientId)where.clientId=Number(req.query.clientId);const trips=await prisma.trip.findMany({where,orderBy:{tripDate:'desc'},include:{route:true,vehicle:true,client:true,driver:true}});res.json(trips.map(t=>({...t,profit:t.amount-(t.diesel+t.driverSalary+t.cleanerSalary+t.toll+t.waterBottle+t.parking+t.adBlue+t.other)})));}));

app.post('/api/expenses',auth,asyncRoute(async(req,res)=>{const e=await prisma.expense.create({data:{expenseTypeId:Number(req.body.expenseTypeId),vehicleId:req.body.vehicleId?Number(req.body.vehicleId):null,month:parseDate(req.body.month),amount:Number(req.body.amount),note:req.body.note||null},include:{expenseType:true,vehicle:true}});res.status(201).json(e);}));
app.get('/api/expenses',auth,asyncRoute(async(req,res)=>{const where={};if(req.query.vehicleId)where.vehicleId=Number(req.query.vehicleId);if(req.query.expenseTypeId)where.expenseTypeId=Number(req.query.expenseTypeId);if(req.query.month){const [y,m]=req.query.month.split('-').map(Number);where.month={gte:new Date(y,m-1,1),lt:new Date(y,m,1)}}res.json(await prisma.expense.findMany({where,orderBy:{month:'desc'},include:{expenseType:true,vehicle:true}}));}));

app.post('/api/diesel',auth,asyncRoute(async(req,res)=>res.status(201).json(await prisma.dieselLog.create({data:{vehicleId:Number(req.body.vehicleId),fillDate:parseDate(req.body.fillDate),amount:Number(req.body.amount),paymentMethod:req.body.paymentMethod||'CASH',note:req.body.note||null},include:{vehicle:true}}))));
app.get('/api/diesel',auth,asyncRoute(async(req,res)=>{const where={};if(req.query.vehicleId)where.vehicleId=Number(req.query.vehicleId);res.json(await prisma.dieselLog.findMany({where,orderBy:{fillDate:'desc'},include:{vehicle:true}}));}));

app.get('/api/dashboard',auth,asyncRoute(async(req,res)=>{
  const month=req.query.month || new Date().toISOString().slice(0,7); const [y,m]=month.split('-').map(Number); const start=new Date(y,m-1,1),end=new Date(y,m,1);
  const trips=await prisma.trip.findMany({where:{tripDate:{gte:start,lt:end}},include:{client:true,vehicle:true}}); const expenses = await prisma.expense.findMany({
  where: {
    month: {
      gte: start,
      lt: end
    }
  },
  include: {
    expenseType: true
  }
}); const diesel=await prisma.dieselLog.findMany({where:{fillDate:{gte:start,lt:end}}});
  const collection=trips.reduce((s,t)=>s+t.amount,0), tripExpenses=trips.reduce((s,t)=>s+t.diesel+t.driverSalary+t.cleanerSalary+t.toll+t.waterBottle+t.parking+t.adBlue+t.other,0), standalone=expenses.reduce((s,e)=>s+e.amount,0)+diesel.reduce((s,e)=>s+e.amount,0);
  const trend=[]; for(let i=5;i>=0;i--){const tm=new Date(y,m-1-i,1),te=new Date(y,m-i,1);const mt=await prisma.trip.aggregate({where:{tripDate:{gte:tm,lt:te}},_sum:{amount:true}});const me=await prisma.expense.aggregate({where:{month:{gte:tm,lt:te}},_sum:{amount:true}});const md=await prisma.dieselLog.aggregate({where:{fillDate:{gte:tm,lt:te}},_sum:{amount:true}});trend.push({name:tm.toLocaleString('en-IN',{month:'short'}),collection:mt._sum.amount||0,expenses:(me._sum.amount||0)+(md._sum.amount||0)});}
  const expenseBreakdown={Diesel:diesel.reduce((s,e)=>s+e.amount,0),...expenses.reduce((o,e)=>{o[e.expenseType.name]=(o[e.expenseType.name]||0)+e.amount;return o;},{}), 'Driver Salary':trips.reduce((s,t)=>s+t.driverSalary,0)};
  const byClient={}; for(const t of trips){const k=t.client.name;byClient[k]??={client:k,trips:0,collection:0,expenses:0};byClient[k].trips++;byClient[k].collection+=t.amount;byClient[k].expenses+=t.diesel+t.driverSalary+t.cleanerSalary+t.toll+t.waterBottle+t.parking+t.adBlue+t.other;}
  const byVehicle={}; for(const t of trips){const k=t.vehicle.regNo;byVehicle[k]??={vehicle:k,trips:0,kms:0,amount:0};byVehicle[k].trips++;byVehicle[k].kms+=t.distanceKm;byVehicle[k].amount+=t.amount;}
  res.json({month,grandTotal:collection,totalExpenses:tripExpenses+standalone,netProfit:collection-tripExpenses-standalone,totalKms:trips.reduce((s,t)=>s+t.distanceKm,0),tripCount:trips.length,trend,expenseBreakdown,clientProfit:Object.values(byClient).map(x=>({...x,profit:x.collection-x.expenses})),vehicleSummary:Object.values(byVehicle)});
}));

app.use((err,req,res,next)=>{console.error(err);const status=err.name==='ZodError'?400:err.code?.startsWith('P')?409:500;res.status(status).json({error:err.message||'Server error'});});
app.listen(PORT,()=>console.log(`API listening on http://localhost:${PORT}`));
