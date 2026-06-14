import jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    sub: 999,
    isAdmin: false,
    roles: ['faculty'],
    permissions: [
      'reports:read',
      'reports:export',
      'students:read',
      'surveys:read',
      'graduation:read',
    ],
    name: 'Cán bộ Khoa Test',
    facultyId: 1,   // ← đổi số này theo khoa
  },
  process.env.JWT_SECRET || 'SECRET_KEY_MAC_DINH',
  { expiresIn: '7d' }
);

console.log(token);