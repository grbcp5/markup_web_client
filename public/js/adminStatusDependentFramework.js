/*****************************************************************************
 * 
 * File: 
 *   /js/adminStatusDependentFramework.js
 *
 * Original Author:
 *   Grant Broadwater
 *
 * Description:
 *   Provides support for making admin status dependent function calls.
 *
 *****************************************************************************/

var userAdminStates = {
  INVALID: -1,

  NONAUTH: 0,
  NONMEMBER: 1,
  MEMBER: 2,
  ADMIN: 3,

  NUMADMINSTATES: 4,

  toString: [ "Non-Auth", "Non-Member", "Member", "Admin" ]
};
var adminStatusDependentFunctions = [
  [],
  [],
  [],
  []
];
var identifiedCurrentUser = null;

/*****************************************************************************
 * 
 * Function:
 *   identifyUser
 * 
 * Parameters:
 *   user - Currently authenticated user (or null).
 * 
 * Description:
 *   Identifies the users admin state.
 * 
 *****************************************************************************/

var identifyUser = function( user ) {

  if( user ) {

    /*
    If the user is signed in there are 3 possible types of users. They are:
      1) They are not a member of Beta Sigma Psi - Eta
      2) They are a member.
      3) They are an admin of the markup system. 
    */
    var userUsername = emailToUsername( user.email )
    var userAdminPath = "/markup/admin/" + userUsername;
    var userAdminRef = ref.child( userAdminPath );
    userAdminRef.once( "value", function( userAdminSnap ) {

      this.currentUser = {
        username: userUsername,
        authValue: user,
        adminStatus: userAdminStates.INVALID
      }

      /* If user is an admin */
      if( userAdminSnap.val() ) {

        this.currentUser.adminStatus = userAdminStates.ADMIN;

      } else { /* User is not an admin */

        var userMemberPath = "/members/" + userUsername;
        var userMemberRef = ref.child( userMemberPath );
        userMemberRef.once( "value", function( userMemberSnap ) {

          /* User is a member */
          if( userMemberSnap.val() ) {

            this.currentUser.adminStatus = userAdminStates.MEMBER;

          } else { /* User is not a member */

            this.currentUser.adminStatus = userAdminStates.NONMEMBER;

          } /* If user is a member */

        } ).then( identifiedUserCallback ); /* userMemberRef.once */

      } /* if user is admin */

    } ).then( identifiedUserCallback ); /* userAdminRef.once */

  } else { /* No user signed in */

    identifiedUserCallback();

  }

}


/*****************************************************************************
 * 
 * Function:
 *   identifiedUserCallback
 * 
 * Parameters:
 *   none
 * 
 * Description:
 *   Called once the users admin status has been identified.
 * 
 *****************************************************************************/

var identifiedUserCallback = function() {

  /* Prevents overwrite if user has already been identified */
  if( identifiedCurrentUser ) {
    return;
  }

  /* Cannot user identifiedCurrentUser because that value must be set to null when no current user */
  var currentIdentifiedUser = {

  };

  /* If no current user */
  if( this.currentUser == null ) {

    currentIdentifiedUser.username = null;
    currentIdentifiedUser.authValue = null;
    currentIdentifiedUser.adminStatus = userAdminStates.NONAUTH;

    identifiedCurrentUser = null;

  } else { /* If there is a current user */

    console.log( "Identified '" + this.currentUser.username + "' as " + userAdminStates.toString[ this.currentUser.adminStatus ] );

    identifiedCurrentUser = this.currentUser;
    currentIdentifiedUser = this.currentUser;
  }

  executeAdminStatusDependentFunctions( currentIdentifiedUser );

}


/*****************************************************************************
 * 
 * Function:
 *   executeAdminStatusDependentFunctions
 * 
 * Parameters:
 *   currentUser = {
 *     username - Current User's username
 *     adminStatus - Current User's admin status
 *     authValue - the auth object provided by firebase
 *   }
 * 
 * Description:
 *   Executes all of the currently queued admin status dependent functions.
 * 
 *****************************************************************************/

var executeAdminStatusDependentFunctions = function( currentUser ) {

  var funcs = adminStatusDependentFunctions[ currentUser.adminStatus ];

  for( var i = 0; i < funcs.length; i++ ) {
    funcs[ i ]( currentUser );
  }

}


/*****************************************************************************
 * 
 * Function:
 *   queueAdminStatusDependentFunction
 * 
 * Parameters:
 *   executionKey - Indicates which admin states to execute the callback for
 *   callback - funciton to be executed
 * 
 * Description:
 *   Executes callback as soon as possible for indicated admin states. 
 * 
 *****************************************************************************/

var queueAdminStatusDependentFunction = function( executionKey, callback ) {

  /* Loop through each possible state */
  for( var i = 0; i < userAdminStates.NUMADMINSTATES; i++ ) {

    /* If the callback is meant to execute for the current state *//* Footnote 1 */
    if( executionKey & ( 1 << i ) ) {

      /* Add to queue or execute imeadiately *//* Footnote 2 */
      if( executeOrQueue( i, callback ) ) {
        return;
      }
    }
  }
}


/*****************************************************************************
 * 
 * Function:
 *   executeOrQueue
 * 
 * Parameters:
 *   adminState - Index of queue
 *   callback - function to execute
 * 
 * Description:
 *   Executes callback as soon as users admin status is identified. Returns
 *   true if the callback is set to execute directly or false if the callback
 *   is queued to execute when the user is identified.
 * 
 *****************************************************************************/

var executeOrQueue = function( adminState, callback ) {

  /* User already identified and callback is ready to execute */
  if( identifiedCurrentUser ) {

    setTimeout( callback, 0, identifiedCurrentUser );
    return true;

  } else { /* User is yet to be identified and callback should be queued for later */

    adminStatusDependentFunctions[ adminState ].push( callback );
    return false;

  }

}


/*****************************************************************************

FOOTNOTES

queueAdminStatusDependentFunction

  1: executionKey & ( 1 << i )

    The execution key is desined so that way it can be defined to execute for 
    more than just one state. To do this, each bit represents a boolean value
    on if it should be executed for a given admin state. For example, if a 
    callback is to be executed for the Admin ( 3 ), and Member ( 2 ) state the 
    3rd and 2nd bit would be set. Thus the statement referencing this footnote
    is doing a check on each bit of the execution key to see if it is set to be
    executed for the current admin state.
  
  2: if( executeOrQueue( i, callback ) ) { return; }

    executeOrQueue returns true if the callback was set to executed directly,
    false otherwise. If the statement was already executed and the executionKey
    includes more than one state, the callback will execute again on the next
    set state. To avoid this, the fuction simply terminates if the callback 
    is set to execute directly.

******************************************************************************/