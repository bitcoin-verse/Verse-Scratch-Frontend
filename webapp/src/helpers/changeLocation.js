export const changeLocation = (href, back) => {
    if (href.includes('http') && !back) {
      window.open(href);
    } else {
      window.location.href = href;
    }
  }