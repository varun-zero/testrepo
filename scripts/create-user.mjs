/**
 * Script to create or update an Admin/User account in MongoDB.
 *
 * Usage:
 *   npm run create:user -- <email> <password> [name] [role]
 *   node --env-file=.env scripts/create-user.mjs <email> <password> [name] [role]
 *
 * Available Roles:
 *   - FACULTY_ADMIN   (Super admin — full control)
 *   - DEVELOPER_ADMIN (Technical operator — system/observability)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';

try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore DNS setServers errors if restricted
}

const MONGODB_URI = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : '';

if (!MONGODB_URI) {
  console.error('\n[create-user] Error: MONGODB_URI is not set in environment or .env file.\n');
  process.exit(1);
}

// Parse Command Line Arguments
const args = process.argv.slice(2);

let email = '';
let password = '';
let name = 'Admin User';
let role = 'DEVELOPER_ADMIN';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--email' && args[i + 1]) {
    email = args[i + 1];
    i++;
  } else if (args[i] === '--password' && args[i + 1]) {
    password = args[i + 1];
    i++;
  } else if (args[i] === '--name' && args[i + 1]) {
    name = args[i + 1];
    i++;
  } else if (args[i] === '--role' && args[i + 1]) {
    role = args[i + 1].toUpperCase();
    i++;
  } else if (!email) {
    email = args[i];
  } else if (!password) {
    password = args[i];
  } else if (name === 'Admin User') {
    name = args[i];
  } else if (i === 3) {
    role = args[i].toUpperCase();
  }
}

const VALID_ROLES = ['FACULTY_ADMIN', 'DEVELOPER_ADMIN'];

if (!email || !password) {
  console.log(`
=====================================================
 Usage Guide: Create Admin User
=====================================================
 Command:
   npm run create:user -- <email> <password> [name] [role]

 Arguments:
   - email:    User email address (e.g. dev@vcet.edu.in)
   - password: User password (min 8 characters)
   - name:     (Optional) Full name (default: "Admin User")
   - role:     (Optional) FACULTY_ADMIN or DEVELOPER_ADMIN (default: "DEVELOPER_ADMIN")

 Examples:
   npm run create:user -- dev@vcet.edu.in MyDevPass123 "Dev Team" DEVELOPER_ADMIN
   npm run create:user -- admin@vcet.edu.in MyAdminPass123 "Main Admin" FACULTY_ADMIN
=====================================================
`);
  process.exit(1);
}

if (password.length < 8) {
  console.error('\n[create-user] Error: Password must be at least 8 characters long.\n');
  process.exit(1);
}

if (!VALID_ROLES.includes(role)) {
  console.error(`\n[create-user] Error: Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(', ')}\n`);
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true, trim: true },
    passwordHash: String,
    role: String,
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
    createdBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function main() {
  console.log('[create-user] Connecting to database...');
  await mongoose.connect(MONGODB_URI, { family: 4, serverSelectionTimeoutMS: 10000 });

  const cleanEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 12);

  const existingUser = await User.findOne({ email: cleanEmail });

  if (existingUser) {
    existingUser.passwordHash = passwordHash;
    existingUser.name = name;
    existingUser.role = role;
    existingUser.isActive = true;
    await existingUser.save();

    console.log(`
✔ Successfully updated existing user:
   - Email: ${cleanEmail}
   - Name:  ${name}
   - Role:  ${role}
   - Pass:  (Password updated successfully)
`);
  } else {
    await User.create({
      name,
      email: cleanEmail,
      passwordHash,
      role,
      isActive: true,
    });

    // Never echo the password back — it is visible in the command history
    // of whoever invoked this script and in CI logs.
    console.log(`
✔ Successfully created new admin user:
   - Email: ${cleanEmail}
   - Name:  ${name}
   - Role:  ${role}
`);
  }
}

main()
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error('\n[create-user] Failed:', err);
    mongoose.disconnect();
    process.exit(1);
  });
