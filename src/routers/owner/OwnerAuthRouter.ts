import { Router } from 'express';
import { ownerAuthController } from '../../controllers/owner/OwnerAuthController';

const router = Router();

router.post('/create-access-code', ownerAuthController.createNewAccessCode);
router.post('/validate-access-code', ownerAuthController.validateAccessCode);

export default router;
