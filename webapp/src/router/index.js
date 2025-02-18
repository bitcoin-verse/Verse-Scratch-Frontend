import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import Tickets from '../pages/Tickets.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/tickets',
      name: 'tickets',
      component: Tickets
    }
  ]
})

router.afterEach((to) => {
  if (to.query.origin === "wallet") {
    sessionStorage.setItem("isWallet", "true");
  }
});

export default router
