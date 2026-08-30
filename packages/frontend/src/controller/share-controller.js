import BaseController from '@/controller/base-controller';

class ShareController extends BaseController {
  static shareFile(fileId, recipientEmail) {
    return this.post('/share', { resourceType: 'file', fileId, recipientEmail });
  }

  static shareFolder(folderId, recipientEmail) {
    return this.post('/share', { resourceType: 'folder', folderId, recipientEmail });
  }

  static getOutgoing() {
    return this.get('/share/outgoing');
  }

  static getIncoming() {
    return this.get('/share/incoming');
  }

  static getSharedFolderFiles(shareId) {
    return this.get(`/share/folder/${shareId}/files`);
  }

  static revoke(shareId) {
    return this.delete('/share/' + shareId);
  }
}

export default ShareController;
