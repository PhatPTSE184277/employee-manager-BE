import { employeeAuthService } from '../../services/employee/EmployeeAuthService';

const setupAccount = async (req: any, res: any) => {
    try {
        const { token, username, password } = req.body;

        if (!token || !username || !password) {
            return res.status(400).json({
                error: 'Missing required fields: token, username, password'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                error: 'Username must be at least 3 characters long'
            });
        }

        const result = await employeeAuthService.setupAccount(
            token,
            username,
            password
        );
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req: any, res: any) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Missing required fields: username, password'
            });
        }

        const result = await employeeAuthService.login(username, password);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
};

export const employeeAuthController = {
    setupAccount,
    login
};
