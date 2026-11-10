export default {
  async rewrites() {
    return [{ source: "/cal/:id.ics", destination: "/api/cal?id=:id" }];
  },
};
