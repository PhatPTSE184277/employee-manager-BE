import { Router } from 'express';
import { employeeAuthController } from '../../controllers/employee/EmployeeAuthController';

const controller = employeeAuthController;
const router = Router();

router.post('/setup-account', controller.setupAccount);
router.post('/login', controller.login);

export default router;
