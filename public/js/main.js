/*****************************************************************************
 * 
 * @File:
 *   /js/main.js
 *
 * @Author:
 *   Grant Broadwater
 *
 * @Description:
 *   Main functionality for all web pages in the beta sig markup project.
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
 *   loadOtherScripts
 * 
 * Parameters:
 *   none
 * 
 * @Description:
 *   Loads all necisary scripts.
 * 
 *****************************************************************************/

var loadOtherScripts = function() {

  var $otherScripts = $( '#other_scripts' );

  var $loading = $( '<script src="/js/loading.js"></script>' );
  $loading.insertBefore( $otherScripts );

  var $support = $( '<script src="/js/support.js"></script>' );
  $support.insertBefore( $otherScripts );

  var $adminStatusDependentFramework = $( '<script src="/js/adminStatusDependentFramework.js"></script>' );
  $adminStatusDependentFramework.insertBefore( $otherScripts );

  var $navigation = $( '<script src="/js/navigation.js"></script>' );
  $navigation.insertBefore( $otherScripts );

};
loadOtherScripts();


startLoadingProcess( adminIdentificationLoadingProcessKey );


/*****************************************************************************
 * 
 * Function:
 *   redirectResultCallback
 * 
 * Parameters:
 *   @param result              The result of the Sign-In Redirect.
 *   @param result.credential   Any credentials returned from the redirect
 *   @param result.user         The user that was returned from the redirect
 * 
 * @Description:
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

};


/*****************************************************************************
 *
 * Function:
 *   setRedirectResultCallback
 * 
 * Parameters:
 *   none
 * 
 * @Description::
 *   Sets the Sign-In Redirect callback.
 * 
 *****************************************************************************/

var setRedirectResultCallback = function() {

  console.log( "Setting redirect result callback" );

  firebase.auth().getRedirectResult().then( redirectResultCallback ); 

};


/*****************************************************************************
 * 
 * Function:
 *   getUserRefForID
 * 
 * Parameters:
 *   @param student_id - student id for a member.
 *   @param callback   - called with snapshot of user's context within the database.
 * 
 * @Description::
 *   Calls callback with user's context within the database. This function is 
 *   useful as the users key in the database is their username not their 
 *   student id.
 * 
 *****************************************************************************/

var getUserRefForID = function( student_id, callback, failureCallback ) {

  var idPath = "/members/usernames/" + student_id;
  var idRef = ref.child( idPath );
  idRef.once( "value", function( snap ) {

    var username = snap.val();
    if( username ) {

      var usernamePath = "/members/" + username;
      var usernameRef = ref.child( usernamePath );
      usernameRef.once( "value", callback );

    } else {
      failureCallback();
    }

  } );

};


/*****************************************************************************
 * 
 * Function:
 *   documentReady
 * 
 * Parameters:
 *   none
 * 
 * @Description::
 *   Callback for when the document is fully loaded.
 * 
 *****************************************************************************/

var documentReady = function() {

};
$( document ).ready( documentReady );


/*****************************************************************************
 * 
 * Function:
 *   onFirebaseAuthStateChanged
 * 
 * Parameters:
 *   user - Currently authenticated user (or null).
 * 
 * @Description::
 *   Dynamically adjusts the web page depending on the current user.
 * 
 *****************************************************************************/

 var onFirebaseAuthStateChanged = function( user ) {

  /* Log the current user */
  logUser( user );

  /* Identify the current user */
  identifyUser( user );

};
firebase.auth().onAuthStateChanged( onFirebaseAuthStateChanged );