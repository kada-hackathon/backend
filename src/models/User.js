// User/Employee Model
// Schema: id user, email, name, password,  division, profile_photo, join_date, role
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({

  email:{
    type : String,
    required : true,
    unique : true,
    match: /.+\@.+\..+/
  },
  name:{
    type : String,
    required : true
  },
  password:{
    type : String,
    required : true
  },
  division:{
    type : String,
    required : true
  },
  profile_photo:{
    type : String
  },
  join_date:{
    type : Date,
    default : Date.now
  },
  role:{
    type : String, enum:['admin', 'user'],
    default : 'user'
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, {
  timestamps: true
});

UserSchema.pre('save', async function(next){
  if(!this.isModified('password')){
    return next();
  }
  const salt= await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function(enteredPassword){
  return await bcrypt.compare(enteredPassword, this.password);
}
module.exports = mongoose.model('User', UserSchema);

