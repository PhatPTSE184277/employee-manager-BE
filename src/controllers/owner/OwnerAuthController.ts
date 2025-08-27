import { Request, Response } from 'express';
import { ownerAuthService } from '../../services/owner/OwnerAuthService';
import { sendSmsTo } from '../../utils/smsTo';

const createNewAccessCode = async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(phoneNumber.replace(/\D/g, ''))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format'
            });
        }

        const accessCode = await ownerAuthService.createNewAccessCode(
            phoneNumber
        );

        await sendSmsTo(
            phoneNumber,
            `Your Employee Manager access code is: ${accessCode}`
        );

        res.status(200).json({
            success: true,
            message: 'Access code sent successfully',
            ...(process.env.NODE_ENV === 'development' && { accessCode })
        });
    } catch (error: any) {
        console.error('Error creating access code:', error);

        if (error.message.includes('owner already exists')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create access code'
        });
    }
};

const validateAccessCode = async (req: Request, res: Response) => {
    try {
        const { phoneNumber, accessCode } = req.body;

        if (!phoneNumber || !accessCode) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and access code are required'
            });
        }

        const result = await ownerAuthService.validateAccessCode(
            phoneNumber,
            accessCode
        );

        res.status(200).json(result);
    } catch (error: any) {
        console.error('Error validating access code:', error);

        if (
            error.message.includes('Invalid access code') ||
            error.message.includes('Phone number not found')
        ) {
            return res.status(401).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to validate access code'
        });
    }
};

export const ownerAuthController = {
    createNewAccessCode,
    validateAccessCode
};
