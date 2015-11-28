//
// util.js
// =======

module.exports = {
  // check if the user have the required permissions (perms)
  check_permissions : function(user_permissions, required_permissions, success, err){
    // Assumption: user_permissions have to contain all the required_permissions
    // Number of permissions_required
    var num_permissions_required = required_permissions.length;
    var list_permissions_found = user_permissions.filter(function(x){
      return num_permissions_required.indexOf(x) < -1;
    });
    console.log(list_permissions_found.length);
  }
}

