import { ownerEmployeeService } from '../../services/owner/OwnerEmployeeService';

const getAllEmployees = async (req: any, res: any) => {
    try {
        const { page, pageSize, search, department, isVerified } = req.query;

        const options = {
            page: page ? parseInt(page) : undefined,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            search,
            department,
            isVerified: isVerified ? isVerified === 'true' : undefined
        };

        const employees = await ownerEmployeeService.getAllEmployees(options);
        res.status(200).json(employees);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};

const getEmployee = async (req: any, res: any) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({ error: 'employeeId required' });
        }

        const employee = await ownerEmployeeService.getEmployee(employeeId);
        res.status(200).json(employee);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};

const createEmployee = async (req: any, res: any) => {
    try {
        const { name, email, phoneNumber, role, address } = req.body;

        if (!name || !email || !phoneNumber || !role || !address) {
            return res.status(400).json({
                error: 'Missing required fields: name, email, phoneNumber, role, address'
            });
        }

        const result = await ownerEmployeeService.createEmployee(
            name,
            email,
            phoneNumber,
            role,
            address
        );

        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const updateEmployee = async (req: any, res: any) => {
    try {
        const { employeeId } = req.params;
        const { name, email, phoneNumber, role, address } = req.body;

        if (!employeeId) {
            return res.status(400).json({ error: 'employeeId required' });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (role) updateData.role = role;
        if (address) updateData.address = address;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No update data provided' });
        }

        const result = await ownerEmployeeService.updateEmployee(
            employeeId,
            updateData
        );
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const deleteEmployee = async (req: any, res: any) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({ error: 'employeeId required' });
        }

        const result = await ownerEmployeeService.deleteEmployee(employeeId);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const ownerEmployeeController = {
    getAllEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee
};
