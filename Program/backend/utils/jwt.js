import jwt from 'jsonwebtoken';

export function generateToken(userId) {
  const secret = process.env.JWT_SECRET || 'securevault_default_jwt_secret_dev_key_32bytes';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign({ id: userId }, secret, {
    expiresIn,
  });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'securevault_default_jwt_secret_dev_key_32bytes';
  return jwt.verify(token, secret);
}
