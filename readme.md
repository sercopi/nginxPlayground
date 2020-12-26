### Dockerization of a State of the Art, modern day Application
This work simmulates the workflow of a modern, state of the art application. Using docker-compose and several dockers to simmulate each machine, we acchieved the current workflow, each in a different container:

///DEVELOPMENT BRANCH

<ul>
<li>
  An entrypoint, using Nginx (<b>oficial Ngingx docker image</b>) as a proxy server to derivate and manage petitions and as a Load Balancer, that distributes the petitions between our applications that are running scaled by docker compose as a series of clones (as much as the user wants).
</li>
  <li>
    A server using nodeJS (<b>node12:alpine image</b>) and express that manages petitions from any client. The server has a middleware defined for authentication via JsonWebTokens and uses a MongoDB docker as a DB
  </li>
  <li>
  A mongoDB database (<b>oficial MongoDB docker image</b>)
  </li>
  <li>
  A client using Vue, to run in the host's machine and consume the application. (in the PRODUCTION environment, it will be built and served on another <b>node12:alpine image</b>)
  </li>
</ul>
