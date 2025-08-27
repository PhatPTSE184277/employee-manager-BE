import { db } from '../../utils/firebase';
import bcrypt from 'bcrypt';

const getProfile = async (employeeId: string) => {
    const employeeDoc = await db.collection('users').doc(employeeId).get();

    if (!employeeDoc.exists) {
        throw new Error('Employee not found');
    }

    const employeeData = employeeDoc.data();
    if (employeeData?.role !== 'employee') {
        throw new Error('User is not an employee');
    }

    const {
        password,
        verificationToken,
        isVerified,
        isAccountSetup,
        workSchedule,
        assignedTasks,
        ...profileData
    } = employeeData;

    return {
        id: employeeDoc.id,
        ...profileData
    };
};

const updateProfile = async (
    employeeId: string,
    updateData: {
        name?: string;
        phoneNumber?: string;
        address?: string;
        username?: string;
        password?: string;
        picture?: string;
    }
) => {
    const employeeDoc = await db.collection('users').doc(employeeId).get();

    if (!employeeDoc.exists) {
        throw new Error('Employee not found');
    }

    const employeeData = employeeDoc.data();
    if (employeeData?.role !== 'employee') {
        throw new Error('User is not an employee');
    }

    const updates: any = {
        updatedAt: Date.now()
    };

    if (updateData.name) {
        updates.name = updateData.name.trim();
    }

    if (updateData.phoneNumber) {
        const phoneRegex = /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/;
        if (!phoneRegex.test(updateData.phoneNumber)) {
            throw new Error('Invalid phone number format');
        }

        const phoneQuery = await db
            .collection('users')
            .where('phoneNumber', '==', updateData.phoneNumber)
            .get();

        const existingPhone = phoneQuery.docs.find(
            (doc) => doc.id !== employeeId
        );
        if (existingPhone) {
            throw new Error('Phone number already exists');
        }

        updates.phoneNumber = updateData.phoneNumber;
    }

    if (updateData.address) {
        updates.address = updateData.address.trim();
    }

    if (updateData.picture !== undefined) {
        updates.picture = updateData.picture.trim();
    }

    if (updateData.username) {
        // Kiểm tra username đã tồn tại chưa
        const usernameQuery = await db
            .collection('users')
            .where('username', '==', updateData.username)
            .get();

        const existingUsername = usernameQuery.docs.find(
            (doc) => doc.id !== employeeId
        );
        if (existingUsername) {
            throw new Error('Username already exists');
        }

        updates.username = updateData.username.trim();
    }

    if (updateData.password) {
        // Validate password strength
        if (updateData.password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        // Hash new password
        updates.password = await bcrypt.hash(updateData.password, 10);
    }

    await db.collection('users').doc(employeeId).update(updates);

    return { success: true, message: 'Profile updated successfully' };
};

const changePassword = async (
    employeeId: string,
    currentPassword: string,
    newPassword: string
) => {
    const employeeDoc = await db.collection('users').doc(employeeId).get();

    if (!employeeDoc.exists) {
        throw new Error('Employee not found');
    }

    const employeeData = employeeDoc.data();
    if (employeeData?.role !== 'employee') {
        throw new Error('User is not an employee');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employeeData.password);
    if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
    }

    if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
    }

    const isSamePassword = await bcrypt.compare(newPassword, employeeData.password);
    if (isSamePassword) {
        throw new Error('New password must be different from current password');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.collection('users').doc(employeeId).update({
        password: hashedNewPassword,
        updatedAt: Date.now()
    });

    return { success: true, message: 'Password changed successfully' };
};

export const employeeProfileService = {
    getProfile,
    updateProfile,
    changePassword
};