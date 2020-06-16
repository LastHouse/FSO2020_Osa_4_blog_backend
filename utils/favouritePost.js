const favouritePost = (array) => {
  const mostLikedPost = array.reduce((prev, current) =>
    +prev.likes > +current.likes ? prev : current
  );

  //console.log(mostLikedPost);
  return mostLikedPost;
};

module.exports = {
  favouritePost,
};
