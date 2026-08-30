const express = require('express');
const router = express.Router();
const shareController = require('../controllers/share-controller');

router.post('/', shareController.createShare);
router.get('/outgoing', shareController.getOutgoingShares);
router.get('/incoming', shareController.getIncomingShares);
router.get('/folder/:shareId/files', shareController.getSharedFolderFiles);
router.delete('/:_id', shareController.revokeShare);

module.exports = router;
