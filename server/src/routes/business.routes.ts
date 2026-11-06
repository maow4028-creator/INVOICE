import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get Business Profile
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let profile = await prisma.businessProfile.findUnique({
      where: { userId: req.userId },
    });

    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: {
          userId: req.userId!,
          businessName: 'My Business',
        },
      });
    }

    res.json({ profile });
  } catch (error: any) {
    console.error('Error fetching business profile:', error);
    res.status(500).json({ message: 'Failed to fetch business profile.' });
  }
});

// Update Business Profile
router.put('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      businessName,
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
      website,
      gstin,
      panNumber,
      registrationNumber,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      logoUrl,
    } = req.body;

    const profile = await prisma.businessProfile.upsert({
      where: { userId: req.userId },
      update: {
        businessName: businessName ?? '',
        ownerName: ownerName ?? '',
        email: email ?? '',
        phone: phone ?? '',
        address: address ?? '',
        city: city ?? '',
        state: state ?? '',
        postalCode: postalCode ?? '',
        country: country ?? '',
        website: website ?? '',
        gstin: gstin ?? '',
        panNumber: panNumber ?? '',
        registrationNumber: registrationNumber ?? '',
        bankName: bankName ?? '',
        accountNumber: accountNumber ?? '',
        ifscCode: ifscCode ?? '',
        upiId: upiId ?? '',
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
      },
      create: {
        userId: req.userId!,
        businessName: businessName ?? 'My Business',
        ownerName: ownerName ?? '',
        email: email ?? '',
        phone: phone ?? '',
        address: address ?? '',
        city: city ?? '',
        state: state ?? '',
        postalCode: postalCode ?? '',
        country: country ?? '',
        website: website ?? '',
        gstin: gstin ?? '',
        panNumber: panNumber ?? '',
        registrationNumber: registrationNumber ?? '',
        bankName: bankName ?? '',
        accountNumber: accountNumber ?? '',
        ifscCode: ifscCode ?? '',
        upiId: upiId ?? '',
        logoUrl: logoUrl ?? '',
      },
    });

    res.json({ message: 'Business profile updated successfully.', profile });
  } catch (error: any) {
    console.error('Error updating business profile:', error);
    res.status(500).json({ message: 'Failed to update business profile.' });
  }
});

export default router;

