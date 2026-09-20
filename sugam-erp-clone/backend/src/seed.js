import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma=new PrismaClient();
const d=(s)=>new Date(s);
async function main(){
 const admin=await prisma.user.upsert({where:{username:'admin'},update:{},create:{name:'Admin',username:'admin',passwordHash:await bcrypt.hash('admin123',12),role:'ADMIN',status:'ACTIVE'}});
 const users=[['Paari','paari24','MANAGER','INACTIVE'],['Karthik','karthik','STAFF','ACTIVE']];for(const [name,username,role,status] of users){await prisma.user.upsert({where:{username},update:{},create:{name,username,passwordHash:await bcrypt.hash('password123',12),role,status}})}
 const routes=['BANGALORE - HYDERABAD','CHENNAI - HYDERABAD','HYDERABAD - BANGALORE','HYDERABAD - CHENNAI']; for(const name of routes) await prisma.route.upsert({where:{name},update:{},create:{name}});
 for(const v of [['TN31CK0444','Bus 0444'],['TN31CM6996','Bus 6996'],['TN12BU9041','Bus 9041'],['TN31CK0666','Bus 0666']]) await prisma.vehicle.upsert({where:{regNo:v[0]},update:{},create:{regNo:v[0],label:v[1]}});
 for(const name of ['TRUGO','PAAYANAM','ABC Travels']) await prisma.client.upsert({where:{name},update:{},create:{name}});
 for(const name of ['Ravi','Kumar','Selvam','Mani']) await prisma.driver.upsert({where:{name},update:{},create:{name}});
 for(const name of ['Bala','Suresh','Arun']) await prisma.cleaner.upsert({where:{name},update:{},create:{name}});
 for(const name of ['Toll','Water Bottle','Parking','AdBlue','Other']) await prisma.expenseType.upsert({where:{name},update:{},create:{name}});
 const counts=await prisma.trip.count(); if(!counts){
   const r=await prisma.route.findMany(),v=await prisma.vehicle.findMany(),c=await prisma.client.findMany(),dr=await prisma.driver.findMany(),cl=await prisma.cleaner.findMany();
   for(let i=0;i<8;i++) await prisma.trip.create({data:{tripDate:d(`2026-08-${String(10+i).padStart(2,'0')}T08:00:00`),routeId:r[i%r.length].id,vehicleId:v[i%v.length].id,clientId:c[i%c.length].id,driverId:dr[i%dr.length].id,cleanerId:cl[i%cl.length].id,distanceKm:420+i*35,ratePerKm:80,amount:(420+i*35)*80,diesel:11000+i*500,driverSalary:2200,cleanerSalary:1200,toll:900,waterBottle:250,parking:300,adBlue:400,other:250,createdById:admin.id}})
 }
 console.log('Seed complete');
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
