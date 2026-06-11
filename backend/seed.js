require('dotenv').config();
const bcrypt    = require('bcryptjs');
const connectDB = require('./config/db');
const User      = require('./models/User');
const Listing   = require('./models/Listing');
const TV        = require('./models/TransporterVerification');

const seed = async () => {
  await connectDB();
  await Promise.all([User.deleteMany({}), Listing.deleteMany({}), TV.deleteMany({})]);
  console.log('✓ Cleared DB');

  const pw = await bcrypt.hash('password123', 12);

  const admin   = await User.create({ name:'Super Admin',         email:'admin@water.com',        password:pw, role:'admin',       verified:true });
  const buyer1  = await User.create({ name:'Ravi Kumar',          email:'ravi@buyer.com',          password:pw, role:'buyer',       verified:true });
  const buyer2  = await User.create({ name:'Priya Sharma',        email:'priya@buyer.com',         password:pw, role:'buyer',       verified:true });
  const seller1 = await User.create({ name:'AquaPure Pvt Ltd',    email:'seller1@water.com',       password:pw, role:'seller',      verified:true });
  const seller2 = await User.create({ name:'HydroTech Solutions', email:'seller2@water.com',       password:pw, role:'seller',      verified:true });
  const t1      = await User.create({ name:'Ramesh Transports',   email:'ramesh@transporter.com',  password:pw, role:'transporter', verified:false, availability:'offline' });
  const t2      = await User.create({ name:'Suresh Logistics',    email:'suresh@transporter.com',  password:pw, role:'transporter', verified:true,  availability:'online' });

  await TV.create({ transporter:t1._id, aadhaarNumber:'1234-5678-9012', licenseNumber:'KA-01-2023-001', vehicleType:'Tanker', vehicleCapacity:5000,  status:'Pending' });
  await TV.create({ transporter:t2._id, aadhaarNumber:'9876-5432-1098', licenseNumber:'KA-02-2022-005', vehicleType:'Tanker', vehicleCapacity:10000, status:'Verified', verifiedBy:admin._id, remarks:'All documents verified' });

  await Listing.create([
    { seller:seller1._id, title:'Premium Drinking Water',    description:'RO purified, TDS < 50 ppm',    location:'Whitefield, Bangalore',       pricePerLitre:2.5,  quantityLitres:10000,  waterType:'drinking' },
    { seller:seller1._id, title:'Agricultural Water Supply', description:'Ground water for irrigation',   location:'Electronic City, Bangalore',  pricePerLitre:0.8,  quantityLitres:50000,  waterType:'agricultural' },
    { seller:seller2._id, title:'Industrial Grade Water',    description:'Treated, meets IS standards',   location:'Peenya, Bangalore',           pricePerLitre:1.2,  quantityLitres:100000, waterType:'industrial' },
    { seller:seller2._id, title:'Rainwater Harvested',       description:'Filtered rainwater, eco-friendly', location:'HSR Layout, Bangalore',   pricePerLitre:0.5,  quantityLitres:20000,  waterType:'rainwater' },
    { seller:seller1._id, title:'Mineral Water Bulk',        description:'Naturally sourced mineral water', location:'Koramangala, Bangalore',   pricePerLitre:3.5,  quantityLitres:5000,   waterType:'drinking' },
  ]);

  console.log('\n✅ Seed complete!\n');
  console.log('━━━ Login Credentials (password: password123) ━━━');
  console.log('👑 Admin:         admin@water.com');
  console.log('🛒 Buyer 1:       ravi@buyer.com');
  console.log('🛒 Buyer 2:       priya@buyer.com');
  console.log('🏪 Seller 1:      seller1@water.com');
  console.log('🏪 Seller 2:      seller2@water.com');
  console.log('🚛 Transporter 1: ramesh@transporter.com  (UNVERIFIED - Pending)');
  console.log('🚛 Transporter 2: suresh@transporter.com  (VERIFIED + ONLINE)');
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });
