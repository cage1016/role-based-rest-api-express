//
// util.js
// =======

module.exports = {
  // check if the user have the required permissions (perms)
  check_permissions : function(user_permissions, required_permissions, success, err){
    // Assumption: user_permissions have to contain all the required_permissions
    // number of permissions_required
    
    // set default values to the parameters
    if(user_permissions === undefined) { user_permissions = [] }
    if(required_permissions === undefined) { required_permissions = [] }
    if(success === undefined) { success = function () { return true; }; }
    if(err === undefined) { err = function() { return false; }; }

    var num_permissions_required = required_permissions.length;
    var list_permissions_found = user_permissions.filter(function(x){
      return required_permissions.indexOf(x) != -1;
    });
    if (list_permissions_found.length === num_permissions_required){
      return success();
    } else {
      return err();
    } 
  }
}

