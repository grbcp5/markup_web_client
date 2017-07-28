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
 *   setNavLinks
 * 
 * Parameters:
 *   user - Currently authenticated user (or null).
 * 
 * Description:
 *   Dynamically sets the navigation links depending on the current user.
 * 
 *****************************************************************************/

var setNavLinks = function( user ) {

  $( "#nav-links" ).empty();

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

      /* If user is an admin */
      if( userAdminSnap.val() ) {

        /* Show Admin Links */
        var viewMembersLink = $( "<a class='mdl-navigation__link' href='/members/'>Members</a>" );
        $( "#nav-links" ).append( viewMembersLink );
        var viewProductsLink = $( "<a class='mdl-navigation__link' href='/products/'>Products</a>" );
        $( "#nav-links" ).append( viewProductsLink );
        var viewTransLink = $( "<a class='mdl-navigation__link' href='/transactions/'>Transactions</a>" );
        $( "#nav-links" ).append( viewTransLink );
        var launchTerminalLink = $( "<a class='mdl-navigation__link' href='/webTerminal/'>Launch Terminal</a>" );
        $( "#nav-links" ).append( launchTerminalLink );

      } else { /* User is not an admin */

        var userMemberPath = "/members/" + userUsername;
        var userMemberRef = ref.child( userMemberPath );
        userMemberRef.once( "value", function( userMemberSnap ) {

          /* User is a member */
          if( userMemberSnap.val() ) {

            /* Show Member Links */
            var viewTransLink = $( "<a class='mdl-navigation__link' href='/transactions/'>Transactions</a>" );
            $( "#nav-links" ).append( viewTransLink );  

          } else { /* User is not a member */

            /* Notify & boot user */
            // TODO: Move to a more appropriate location
            alert( "You are not currently registered to use the markup System.\n\n"
                   + "Please contact the markup chair to register." );
            firebase.auth().signOut();

          } /* If user is a member */

        } ); /* userMemberRef.once */

      } /* if user is admin */

    } ); /* userAdminRef.once */

  } else {

    var signInLink = $( "<a class='mdl-navigation__link' href='#'>Sign In</a>" );
    signInLink.click( signInButtonHandler );
    $( "#nav-links" ).append( signInLink );

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

  setNavLinks( user );

  if( user ) {

    console.log( "Current User:" );
    console.log( user );

    $( "#sign-in-button-text" ).text( emailToUsername( user.email ) );
    $( "#sign-in-button" ).click( function() {
      alert( user.displayName + " already signed in." );
    } );
    setRedirectResultCallback();

  } else {

    console.log( "No user signed in" );

    $( "#sign-in-button" ).click( signInButtonHandler );

  }

}
firebase.auth().onAuthStateChanged( onFirebaseAuthStateChanged );
