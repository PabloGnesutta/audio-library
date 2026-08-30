const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Upload } = require('@aws-sdk/lib-storage');

// esta instanciacion podria estar encapsulada en un StorageFactory para abstraernos del provedor
const audioLibraryBucket = process.env.R2_BUCKET_NAME;
const s3 = new S3Client({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const COMMANDS = {
  getObject: GetObjectCommand,
};

class AmazonS3Helper {
  static uploadDataToBucket(params) {
    params.Bucket = audioLibraryBucket;
    const upload = new Upload({ client: s3, params });
    return upload.done();
  }

  static deleteFile(params) {
    params.Bucket = audioLibraryBucket;
    return s3.send(new DeleteObjectCommand(params));
  }

  static getSignedUrl(type, params) {
    params.Bucket = audioLibraryBucket;
    const Command = COMMANDS[type];
    if (!Command) return Promise.reject(new Error(`Unsupported S3 signed url type: ${type}`));
    const { Expires, ...commandParams } = params;
    return getSignedUrl(s3, new Command(commandParams), { expiresIn: Expires });
  }
}

module.exports = AmazonS3Helper;
