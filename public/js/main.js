/*****************************************************************************
 * 
 * File: 
 *   /js/main.js
 *
 * Original Author:
 *   Grant Broadwater
 *
 * Description:
 *   Main functionality for all webpages in the beta sig markup project.
 *
 *****************************************************************************/

/* Firebase database reference */
var ref = firebase.database().ref();

/* Firebase Authentication Provider */
var provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters( {
  'login_hint': 'Use your @mst.edu email'
} );

var loadingContent = false;

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
 *   usernameFromEmail
 * 
 * Parameters:
 *   email - The user's email containing the user's username.
 * 
 * Description:
 *   Trims the '@mst.edu' from the email to leave the username.
 *
 *****************************************************************************/

var emailToUsername = function( email ) {
  
  return email.split( "@" )[0];

}

/*****************************************************************************
 * 
 * Function:
 *   redirectResultCallback
 * 
 * Parameters:
 *   result - The result of the Sign-In Redirect.
 * 
 * Description:
 *   Logs the credentials and the user (if they exist) as a result of the 
 *   sign-in redirect.
 *
 *****************************************************************************/

var redirectResultCallback = function( result ) {

  if( result.credential ) {
    console.log( "Redirect Result Credentials:" );
    console.log( result.credential );
  }

  if( result.user ) {
    console.log( "Redirect Result User:" );
    console.log( result.user );
  }

}


/*****************************************************************************
 *
 * Function:
 *   setRedirectResultCallback
 * 
 * Parameters:
 *   none
 * 
 * Description:
 *   Sets the Sign-In Redirect callback.
 * 
 *****************************************************************************/

var setRedirectResultCallback = function() {

  console.log( "Setting redirect result callback" );

  firebase.auth().getRedirectResult().then( redirectResultCallback ); 

}


/*****************************************************************************
 * 
 * Function:
 *   getUserRefForID
 * 
 * Parameters:
 *   student_id - student id for a member.
 *   callback   - called with snapshot of user's context within the database.
 * 
 * Description:
 *   Calls callback with user's context within the database. This function is 
 *   useful as the users key in the database is their username not their 
 *   student id.
 * 
 *****************************************************************************/

var getUserRefForID = function( student_id, callback ) {

  var idPath = "/members/usernames/" + student_id;
  var idRef = ref.child( idPath );
  idRef.once( "value", function( snap ) {

    username = snap.val();
    if( username ) {
      usernamePath = "/members/" + username;
      usernameRef = ref.child( usernamePath );
      usernameRef.once( "value", callback );
    }

  } );

}


/*****************************************************************************
 * 
 * Function:
 *   signInButtonHandler
 * 
 * Parameters:
 *   none
 * 
 * Description:
 *   Callback when the sign in button is clicked.
 * 
 *****************************************************************************/

var signInButtonHandler = function() {

  firebase.auth().signInWithRedirect( provider ); 

}


/*****************************************************************************
 * 
 * Function:
 *   documentReady
 * 
 * Parameters:
 *   none
 * 
 * Description:
 *   Callback for when the document is fully loaded.
 * 
 *****************************************************************************/

var documentReady = function() {
  
}
$( document ).ready( documentReady );


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
 * 
 * Function:
 *   setAdminNavLinks
 * 
 * Parameters:
 *   user - Currently authenticated user (or null).
 * 
 * Description:
 *   Dynamically sets the navigation links for an administrator.
 * 
 *****************************************************************************/

var setAdminNavLinks = function( user ) {

  /* Remove any existing links */
  $( "#nav-links" ).empty();

  /* Show Admin Links */
  var viewMembersLink = $( "<a class='mdl-navigation__link' href='/members/'>Members</a>" );
  $( "#nav-links" ).append( viewMembersLink );
  var viewProductsLink = $( "<a class='mdl-navigation__link' href='/products/'>Products</a>" );
  $( "#nav-links" ).append( viewProductsLink );
  var viewTransLink = $( "<a class='mdl-navigation__link' href='/transactions/'>Transactions</a>" );
  $( "#nav-links" ).append( viewTransLink );
  var launchTerminalLink = $( "<a class='mdl-navigation__link' href='/webTerminal/'>Launch Terminal</a>" );
  $( "#nav-links" ).append( launchTerminalLink );
  var signOutButton = $( '<div class="button-container"><a class="mdl-navigation__link"><button class="sign-out-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent"><i class="material-icons">fingerprint</i><span class="sign-out-button-text">Sign Out</span></button></a></div>' );
  signOutButton.click( function() {
    firebase.auth().signOut();
    window.location.reload();
  } );
  $( "#nav-links" ).append( signOutButton );

}
queueAdminStatusDependentFunction( ( 1 << userAdminStates.ADMIN ), setAdminNavLinks );


/*****************************************************************************
 * 
 * Function:
 *   setMemberNavLinks
 * 
 * Parameters:
 *   user - Currently authenticated user (or null).
 * 
 * Description:
 *   Dynamically sets the navigation links for a member.
 * 
 *****************************************************************************/

var setMemberNavLinks = function( user ) {

  /* Remove any existing links */
  $( "#nav-links" ).empty();

  /* Show Member Links */
  var viewTransLink = $( "<a class='mdl-navigation__link' href='/transactions/'>Transactions</a>" );
  $( "#nav-links" ).append( viewTransLink );
  var viewProducts = $( "<a class='mdl-navigation__link' href='/products/'>Products</a>" );
  $( "#nav-links" ).append( viewProducts );  
  var signOutButton = $( '<div class="button-container"><a class="mdl-navigation__link"><button class="sign-out-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent"><i class="material-icons">fingerprint</i><span class="sign-out-button-text">Sign Out</span></button></a></div>' );
  signOutButton.click( function() {
    firebase.auth().signOut();
    window.location.reload();
  } );
  $( "#nav-links" ).append( signOutButton );

}
queueAdminStatusDependentFunction( ( 1 << userAdminStates.MEMBER ), setMemberNavLinks );


/*****************************************************************************
 * 
 * Function:
 *   signOutNonMember
 * 
 * Parameters:
 *   user - Currently authenticated user (or null).
 * 
 * Description:
 *   Sign out user if they are not a member.
 * 
 *****************************************************************************/

var signOutNonMember = function( user ) {

  alert( "You are not currently registered to use the markup System.\n\n"
         + "Please contact the markup chair to register." );
  firebase.auth().signOut();

}
queueAdminStatusDependentFunction( ( 1 << userAdminStates.NONMEMBER ), signOutNonMember );


/*****************************************************************************
 * 
 * Function:
 *   setLinksForNullAuthUsers
 * 
 * Parameters:
 *   None
 * 
 * Description:
 *   Set the navigation links for a user that isn't currently signed in.
 * 
 *****************************************************************************/

var setLinksForNullAuthUsers = function() {

  var signInButton = $( '<div class="button-container"><button class="sign-in-button mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent"><i class="material-icons">fingerprint</i><span class="sign-in-button-text">Sign In</span></button></div>' );
  signInButton.click( signInButtonHandler );
  $( "#nav-links" ).append( signInButton );

}
queueAdminStatusDependentFunction( ( 1 << userAdminStates.NONAUTH ), setLinksForNullAuthUsers );


/*****************************************************************************
 * 
 * Function:
 *   setSignInButtonForUser
 * 
 * Parameters:
 *   currentUser = {
 *     username - Current User's username
 *     adminStatus - Current User's admin status
 *     authValue - the auth object provided by firebase
 *   }
 * 
 * Description:
 *   Sets the sign in button for the current user.
 * 
 *****************************************************************************/

var setSignInButtonForUser = function( currentUser ) {

  $( ".sign-in-button-text" ).text( emailToUsername( currentUser.authValue.email ) );
    $( ".sign-in-button" ).click( function() {
      alert( currentUser.authValue.displayName + " already signed in." );
    } );
    setRedirectResultCallback();

}
queueAdminStatusDependentFunction( ( ~( 1 << userAdminStates.NONAUTH ) ), setSignInButtonForUser );

/*****************************************************************************
 * 
 * Function:
 *   setSignInButtonForNonUser
 * 
 * Parameters:
 *   none
 * 
 * Description:
 *   Sets the sign in button when there is not a current user;
 * 
 *****************************************************************************/

var setSignInButtonForNonUser = function() {

  $( ".sign-in-button-text" ).text( "Sign In" );
  $( ".sign-in-button" ).click( signInButtonHandler );

}
queueAdminStatusDependentFunction( ( 1 << userAdminStates.NONAUTH ), setSignInButtonForNonUser );


/*****************************************************************************
 * 
 * Function:
 *   logUser
 * 
 * Parameters:
 *   user - The authValue of the current user.
 * 
 * Description:
 *   Logs the auth value of the current user to the console.
 * 
 *****************************************************************************/

var logUser = function( user ) {

  if( user ) {

    console.log( "Current User:" );
    console.log( user );

  } else {

    console.log( "No user signed in" );

  }

}


/*****************************************************************************
 * 
 * Function:
 *   onFirebaseAuthStateChanged
 * 
 * Parameters:
 *   user - Currently authenticated user (or null).
 * 
 * Description:
 *   Dynamically adjusts the web page depending on the current user.
 * 
 *****************************************************************************/

 var onFirebaseAuthStateChanged = function( user ) {

  /* Log the current user */
  logUser( user );

  /* Identify the current user */
  identifyUser( user );

  /* Terminate the loading screen */
  if( !loadingContent ) {
    $( "#loading-screen" ).hide();
  }

}
firebase.auth().onAuthStateChanged( onFirebaseAuthStateChanged );

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
