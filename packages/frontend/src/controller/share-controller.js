import BaseController from '@/controller/base-controller';

class ShareController extends BaseController {
  static shareFile(fileId, recipientEmail) {
    return this.post('/share', { fileId, recipientEmail });
  }

  static getOutgoing() {
    return this.get('/share/outgoing');
  }

  static getIncoming() {
    return this.get('/share/incoming');
  }

  static revoke(shareId) {
    return this.delete('/share/' + shareId);
  }
}

export default ShareController;
