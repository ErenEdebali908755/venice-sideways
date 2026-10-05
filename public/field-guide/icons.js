/* Selected native visual-pack icons; button labels supply localized meaning. */
const names=new Set(["back","close","next","previous","gallery","zoom-in","zoom-out","location","recenter","location-stop","sun","moon","system","check","warning","boat"]);
export const icon=(name)=>names.has(name)?`<svg class="fg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="/field-guide/icons.svg?v=20261005-mobile#${name}"></use></svg>`:"";
