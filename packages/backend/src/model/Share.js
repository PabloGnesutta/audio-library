const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ShareSchema = new Schema({
  resourceType: { type: String, enum: ['file', 'folder'], default: 'file' },

  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  fileId: {
    type: Schema.Types.ObjectId,
    ref: 'File'
  },
  folderId: Number, // set when resourceType === 'folder' (matches owner's folders[].id)

  mode: { type: String, enum: ['account', 'public'], default: 'account' },
  sharedWith: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  token: { type: String, unique: true, sparse: true }, // set when mode === 'public'

  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Share', ShareSchema);
