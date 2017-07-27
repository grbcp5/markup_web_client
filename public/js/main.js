var ref = firebase.database().ref();
var provider = new firebase.auth.GoogleAuthProvider();
provider.setCustomParameters( {
  'login_hint': 'Use your @mst.edu email'
} );

var signInButtonHandler = function() {

  firebase.auth().signInWithRedirect( provider );
 
  /*
  firebase.auth().getRedirectResult().then( function( result ) {

    if( result.credential ) {
      alert( "Credentials" );
      console.log( "Credentials" );
      console.log( result.credential );
    }

    alert( "User" );
    console.log( "User" );
    console.log( result.user );

  } );
  */

}

$( document ).ready( function() {

} );

firebase.auth().onAuthStateChanged( function( user ) {

  if( user ) {

    console.log( "Current User:" );
    console.log( user );

    $( "#sign-in-button-text" ).text( user.displayName );

  } else {

    console.log( "No user signed in" );

    $( "#sign-in-button" ).click( signInButtonHandler );

  }

} );
