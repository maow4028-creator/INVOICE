import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'premium_invoice_super_secure_jwt_secret_2026';

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(400).json({ message: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        businessProfile: {
          create: {
            businessName: `${name.trim()}'s Business`,
            ownerName: name.trim(),
            email: normalizedEmail,
            currency: 'INR',
          } as any,
        },
        settings: {
          create: {
            defaultCurrency: 'INR',
            defaultCurrencySymbol: '₹',
            defaultTax: 18.0,
            defaultPaymentTerms: 'Net 30',
            invoicePrefix: 'INV-2026-',
            nextInvoiceNumber: 1001,
            defaultTemplate: 'modern-blue',
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
});

// Login
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Demo 1-Click Login
router.post('/demo', async (req, res: Response): Promise<void> => {
  try {
    const demoEmail = 'demo@invoicepro.com';
    let user = await prisma.user.findUnique({
      where: { email: demoEmail },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('demo123456', 10);
      user = await prisma.user.create({
        data: {
          name: 'Apex Studio & Co.',
          email: demoEmail,
          password: hashedPassword,
          businessProfile: {
            create: {
              businessName: 'Apex Studio & Technologies',
              ownerName: 'Alexander Hayes',
              email: 'billing@apexstudio.design',
              phone: '+91 98765 43210',
              address: 'Suite 402, Skyline Executive Towers, Cyber City',
              city: 'Bengaluru',
              state: 'Karnataka',
              postalCode: '560103',
              country: 'India',
              website: 'https://apexstudio.design',
              gstin: '29ABCDE1234F1Z5',
              panNumber: 'ABCDE1234F',
              bankName: 'HDFC Bank Ltd',
              accountNumber: '50200012345678',
              ifscCode: 'HDFC0000240',
              upiId: 'apexstudio@hdfcbank',
            },
          },
          settings: {
            create: {
              defaultCurrency: 'INR',
              defaultCurrencySymbol: '₹',
              defaultTax: 18.0,
              defaultPaymentTerms: 'Net 30',
              invoicePrefix: 'INV-2026-',
              nextInvoiceNumber: 1005,
              defaultTemplate: 'modern-blue',
              defaultAccentColor: '#123B5D',
            },
          },
        },
      });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Logged in to Demo account.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    res.status(500).json({ message: 'Server error during demo login.' });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        businessProfile: true,
        settings: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch user details.' });
  }
});

// Update Profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name: name ? name.trim() : undefined,
        email: email ? email.toLowerCase().trim() : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    res.json({ message: 'Profile updated.', user: updated });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// Change Password
router.put('/password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Both current and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Incorrect current password.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to change password.' });
  }
});

// Forgot Password mock
router.post('/forgot-password', async (req, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Email is required.' });
    return;
  }
  // In demo/local environment, send helpful simulation response
  res.json({
    message: 'If an account exists with this email, a reset link has been dispatched.',
  });
});

export default router;

