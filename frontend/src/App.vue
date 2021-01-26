<template>
  <div>
    <router-view />
  </div>
</template>

<script>
import { eventBus } from "./main.js";
import axios from "axios";

export default {
  name: "App",
};
</script>
