import axios from 'axios';
import Config from '../config';
import BaseController from "@/controller/base-controller";


class FileController extends BaseController {
  static getUrl(fileId, folderId) {
    return this.post(`/file/${fileId}/url`, { folderId });
  }

  static getFilesForFolder(folderId) {
    return this.get(`/file/folder/${folderId}`);
  }

  static uploadFile(file, config, folderId, duration) {
    config.headers = {
      "Content-Type": "multipart/form-data",
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderId", folderId);
    formData.append("duration", duration);
    return axios.post(`${Config.BACKEND_API_URL}/file`, formData, config);
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