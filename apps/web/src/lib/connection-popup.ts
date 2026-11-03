/** Reserve the window during the click, before a server request consumes the user gesture. */
export function prepareConnectionPopup(blockedMessage: string) {
  const popup = window.open("about:blank", "_blank", "popup,width=560,height=720");
  if (!popup) throw new Error(blockedMessage);
  popup.opener = null;
  let opened = false;
  return {
    open(url: string) {
      if (popup.closed) throw new Error(blockedMessage);
      popup.location.replace(url);
      opened = true;
    },
    closeUnused() {
      if (!opened) popup.close();
    },
  };
}
