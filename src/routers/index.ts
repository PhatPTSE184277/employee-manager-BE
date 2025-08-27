import { Router } from 'express';
import ownerRouter from './owner';
import employeeRouter from './employee';
import chatRouter from './chat';

const router = Router();

router.use('/owner', ownerRouter);
router.use('/employee', employeeRouter);
router.use('/chat', chatRouter);

export default router;
