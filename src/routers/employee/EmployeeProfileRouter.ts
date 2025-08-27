import { Router } from 'express';
import { employeeProfileController } from '../../controllers/employee/EmployeeProfileController';
import { VerifyToken } from '../../middlewares/VerifyToken';

const controller = employeeProfileController;
const router = Router();

router.get('/', VerifyToken, controller.getProfile);
router.put('/', VerifyToken, controller.updateProfile);
router.put('/change-password', VerifyToken, controller.changePassword);

export default router;
