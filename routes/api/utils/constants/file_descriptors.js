// Identities
const NAME_COMMITMENTS_DESC = `DO NOT EDIT. 
This file contains the saved name commitments that you can use to create VerusIDs. Editing it will most 
likely cause your VerusID creation to fail.`

// Currencies
const BLACKLIST_DESC = `This file contains currencies you have chosen to blacklist, i.e. never see again.
They will not appear in any part of your wallet, on the chains they are children of here.`

const WHITELIST_DESC = `This file contains currencies you have chosen to whitelist, i.e. always track.
These will always appear in your wallet page for the chains they are children of, until you remove them.`

const GRAYLIST_DESC = `This file contains a list of curated currencies that will appear in your wallet if
they aren't blacklisted, and you have a balance above 0 of them.`

module.exports = {
  NAME_COMMITMENTS_DESC,
  BLACKLIST_DESC,
  WHITELIST_DESC,
  GRAYLIST_DESC
}