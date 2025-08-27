import { employeeProfileService } from '../../services/employee/EmployeeProfileService';

const getProfile = async (req: any, res: any) => {
    try {
        const employeeId = req.user?.userId;

        if (!employeeId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const profile = await employeeProfileService.getProfile(employeeId);
        res.status(200).json(profile);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};

const updateProfile = async (req: any, res: any) => {
    try {
        const employeeId = req.user?.userId;
        const { name, phoneNumber, address, username, password, picture } = req.body;

        if (!employeeId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (address) updateData.address = address;
        if (username) updateData.username = username;
        if (password) updateData.password = password;
        if (picture !== undefined) updateData.picture = picture;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No update data provided' });
        }

        const result = await employeeProfileService.updateProfile(
            employeeId,
            updateData
        );
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};


const changePassword = async (req: any, res: any) => {
    try {
        const employeeId = req.user?.userId;
        const { currentPassword, newPassword } = req.body;

        if (!employeeId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        const result = await employeeProfileService.changePassword(
            employeeId,
            currentPassword,
            newPassword
        );

        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const employeeProfileController = {
    getProfile,
    updateProfile,
    changePassword
};