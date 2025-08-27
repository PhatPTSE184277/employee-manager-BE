import { Router } from 'express';
import { ownerEmployeeController } from '../../controllers/owner/OwnerEmployeeController';
import { VerifyToken } from '../../middlewares/VerifyToken';

const controller = ownerEmployeeController;
const router = Router();

router.get('/', VerifyToken, controller.getAllEmployees);
router.get('/:employeeId', VerifyToken, controller.getEmployee);
router.post('/', VerifyToken, controller.createEmployee);
router.put('/:employeeId', VerifyToken, controller.updateEmployee);
router.delete('/:employeeId', VerifyToken, controller.deleteEmployee);

export default router;
