import { db } from '../../utils/firebase';
import jwt from 'jsonwebtoken';

const generateCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const createNewAccessCode = async (phoneNumber: string) => {
    const existingOwnerQuery = await db
        .collection('users')
        .where('role', '==', 'owner')
        .get();

    if (!existingOwnerQuery.empty) {
        const existingOwner = existingOwnerQuery.docs[0];
        const ownerData = existingOwner.data();
        
        if (ownerData.phoneNumber !== phoneNumber) {
            throw new Error('An owner already exists in the system with a different phone number');
        }
        
        const accessCode = generateCode();
        
        await existingOwner.ref.update({
            accessCode,
            updatedAt: Date.now()
        });

        console.log(`SMS code for existing owner ${phoneNumber}: ${accessCode}`);
        return accessCode;
    }

    const accessCode = generateCode();

    await db.collection('users').doc(`phone_${phoneNumber}`).set(
        {
            phoneNumber,
            accessCode,
            role: 'owner',
            createdAt: Date.now(),
            isVerified: false
        },
        { merge: true }
    );

    console.log(`SMS code for new owner ${phoneNumber}: ${accessCode}`);
    return accessCode;
};

const validateAccessCode = async (phoneNumber: string, accessCode: string) => {
    const ownerQuery = await db
        .collection('users')
        .where('role', '==', 'owner')
        .where('phoneNumber', '==', phoneNumber)
        .limit(1)
        .get();

    if (ownerQuery.empty) {
        throw new Error('Phone number not found or not registered as owner');
    }

    const ownerDoc = ownerQuery.docs[0];
    const data = ownerDoc.data();

    if (data?.accessCode !== accessCode) {
        throw new Error('Invalid access code');
    }

    await ownerDoc.ref.update({ 
        accessCode: '',
        isVerified: true,
        lastLoginAt: Date.now()
    });

    const token = jwt.sign(
        {
            userId: ownerDoc.id,
            phoneNumber: data.phoneNumber,
            role: data.role,
            name: data.name || 'Owner'
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
    );

    return { 
        success: true, 
        token,
        user: {
            id: ownerDoc.id,
            phoneNumber: data.phoneNumber,
            role: data.role,
            name: data.name || 'Owner'
        }
    };
};

export const ownerAuthService = {
    createNewAccessCode,
    validateAccessCode
};