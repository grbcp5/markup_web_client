var ref = firebase.database().ref();

$( document ).ready( function() {

  var authorRef = ref.child( 'author' );

  authorRef.once( 'value', function( snapshot ) {

    alert( "Author: " + snapshot.val() );

  } );

} );
