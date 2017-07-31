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
  loadingContent = true;
}
$( document ).ready( documentReady );

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

 var onFirebaseAuthStateChanged_MembersPage = function( user ) {

  if( user ) {

    var userUsername = emailToUsername( user.email );
    var userAdminPath = "/markup/admin/" + userUsername;
    var userAdminRef = ref.child( userAdminPath );
    userAdminRef.once( "value", function( userAdminSnap ) {

      /* If user is admin */
      if( userAdminSnap.exists() ) {

        populateMemberList( user );
        $( "#loading-screen" ).hide();

      } else { /* User is not an admin */
        alert( "You must be a markup admin to manage registered members." );
        window.location.replace( "/" );
      }

    } );

  } else {

    alert( "You must be a markup admin to manage registered members." );
    window.location.replace( "/" );

  }

}
firebase.auth().onAuthStateChanged( onFirebaseAuthStateChanged_MembersPage );


/*****************************************************************************
 * 
 * Function:
 *   changeAdminContext
 * 
 * Parameters:
 *   memberContext - Relevant data pertaining to the member who is having 
 *                   their admin status changed.
 * 
 * Description:
 *   Completes action after user has indicated to change a member's admin 
 *   status.
 * 
 *****************************************************************************/

var changeAdminStatus = function( memberContext ) {

  var userSelection 
    = confirm( "Are you sure you want to change " + memberContext.name + "'s admin status from " + 
               memberContext.isAdmin + " to " + $( "#" + memberContext.checkID ).prop('checked') + "?" );

    if( userSelection ) {
      
      changes = {}

      changes['/members/' + memberContext.username + '/markup/admin' ] = ( !memberContext.isAdmin ? true : null );
      changes['/markup/admin/' + memberContext.username ] = ( !memberContext.isAdmin ? true : null );

      firebase.database().ref().update( changes );
    } else {
      // TODO: Just cancel 
      location.reload();
    }

}

var clearMemberHandler = function( memberContext ) {
  confirm( "Are you sure you want to remove " + memberContext.name + " as a member?" );
} 

/*****************************************************************************
 * 
 * Function:
 *   populateMemberList
 * 
 * Parameters:
 *   none
 * 
 * Description:
 *   Populate the member list assuming user is already authenticated and is
 *   verified as admin.
 * 
 *****************************************************************************/

var populateMemberList = function( currentUser ) {

  var membersPath = "/members";
  var membersRef = ref.child( membersPath );
  membersRef.once( "value",  function( membersSnap ) {

    membersSnap.forEach( function( memberSnap ) {

      if( memberSnap.key === "usernames" ) {
        return;
      }

      //alert( "Member: " + memberSnap.val().school.id );
      
      var memberContext = {
        username: memberSnap.val().school.username,
        name: memberSnap.val().name.first + " " + memberSnap.val().name.last,
        isAdmin: memberSnap.val().markup ? ( ( memberSnap.val().markup.admin ) ? true : false ) : false,
        checkID: memberSnap.val().school.username + "Check",
        labelID: memberSnap.val().school.username + "Label"
      }
      var clearID = memberSnap.val().school.username + "Clear";
      var checkVal = ( memberContext.isAdmin ) ? "Checked" : "";
      var isAdminStr = "Is Markup Admin";
      var isNotAdminStr = "Is Not Markup Admin";

      // TODO: Make mdl.io checkbox
      var memberDiv = $(
        '<div class="mdl-cell mdl-cell--6-col">' +
          '<div class="cell-container direct-content-cell">' +
            '<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="' + memberContext.checkID +'" id="' + memberContext.labelID + '">' +
              '<input type="checkbox" id="' + memberContext.checkID + '" class="mdl-checkbox__input" ' + checkVal + '>' +
              '<span class="mdl-checkbox__label">' + memberContext.name + '</span>' +
              '<button class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored" style="float: right;" id="' + clearID + '"><i class="material-icons">clear</i></button>' +
            '</label>' +
            '<div class="mdl-tooltip" data-mdl-for="' + memberContext.labelID + '">' +
              ( ( memberContext.isAdmin ) ? isAdminStr : isNotAdminStr ) +
            '</div>' +
          '</div>' +
        '</div>' 
      );

      memberDiv.change( function() {
        if( !changeAdminStatus( memberContext, $( this ) ) ) {
          return false;
        }
      } );

      memberDiv.insertBefore( $( "#membersPlacehoder" ) );

      if( emailToUsername( currentUser.email ) === memberContext.username ) {
        $( "#" + memberContext.checkID ).prop( "disabled", true );
        $( "#" + clearID ).prop( "disabled", true );
      }

      $( "#" + clearID ).click( function() {
        clearMemberHandler( memberContext );
      } );

    } );


  } ); 

}









