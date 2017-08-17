/*****************************************************************************
 * 
 * File: 
 *   /js/navigation.js
 *
 * Original Author:
 *   Grant Broadwater
 *
 * Description:
 *   Provides navigation bar functionality.
 *
 *****************************************************************************/

var navigationLoadingProcessKey = "NavigationLoadingProcess";

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
  var launchTerminalLink = $( "<a class='mdl-navigation__link' href='/webTerminal/'>Web Terminal</a>" );
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