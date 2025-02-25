export const changeLocation = (href) => {
    if (href.includes('http')) {
      window.open(href);
    } else {
      window.location.href = href;
    }
  }