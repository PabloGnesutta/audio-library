import axios from 'axios';
import BaseController from "@/controller/base-controller";


class FileController extends BaseController {
  static getUrl(fileId, folderId) {
    return this.post(`/file/${fileId}/url`, { folderId });
  }

  static getFilesForFolder(folderId) {
    return this.get(`/file/folder/${folderId}`);
  }

  static search(query) {
    return this.get('/file/search', { q: query });
  }

  // One call for the whole batch instead of one per file -- avoids N round
  // trips before any file can start uploading.
  static getUploadUrls(files) {
    return this.post('/file/upload-urls', {
      files: files.map((file) => ({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      })),
    });
  }

  static async uploadFile(file, config, folderId, duration, { url, key }) {
    // Direct PUT to the R2 presigned URL -- do not route this through the
    // app's `transport` instance: it injects our own Authorization bearer
    // token and withCredentials, neither of which R2 expects (the signed
    // URL carries its own auth), and an unexpected header here can fail
    // signature validation.
    await axios.put(url, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: config.onUploadProgress,
    });

    return this.post('/file/confirm', {
      key,
      folderId,
      duration,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  }

  static updateFile(_id, param, value) {
    return this.put('/file', { _id, param, value });
  }

  static deleteFile(_id) {
    return this.delete('/file/' + _id);
  }

  static updateMultipleFiles(fileIdsList, param, value) {
    return this.put('/file/multiple-files', { fileIdsList, param, value });
  }

  static addTagsToMultipleFiles(fileIdsList, tags) {
    return this.put('/file/multiple-files/tags', { fileIdsList, tags });
  }

  static updateMetadata(_id, param, currentTime) {
    return this.put(`/file/metadata`, { _id, param, value: currentTime });
  }
}

export default FileController;