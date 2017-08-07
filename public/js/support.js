

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