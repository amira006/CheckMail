const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Le nom est obligatoire'],
      trim:      true,
    },
    email: {
      type:      String,
      required:  [true, 'Email obligatoire'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    password: {
      type:      String,
      required:  [true, 'Mot de passe obligatoire'],
      minlength: [6, 'Minimum 6 caractères'],
      select:    false,
    },
  },
  { timestamps: true }
);

// Hasher le mot de passe avant de sauvegarder
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour vérifier le mot de passe
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour retourner l'user sans le mot de passe
UserSchema.methods.toPublic = function () {
  return {
    id:        this._id,
    name:      this.name,
    email:     this.email,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);