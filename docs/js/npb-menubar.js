class NpbMenubar extends HTMLElement {
  static get observedAttributes() {
    return ["pathname"];
  }

  constructor() {
    super();
  }

  render() {
    const style = `<style>
    @import url("../css/npb-colors-applied.css");

    #menu {
      box-sizing: border-box;
      min-width: 1200px;
      display: flex;
      list-style: none;
      width: 100%;
      height: 44px;
      margin: 0 auto 1rem;
      padding: 8px 0 8px 24px;
      background-color: #2862ae;
      color: white;
      box-shadow: rgb(0 0 0) 1px 0px 5px;
      box-sizing: border-box;
    }
    #menu>li {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 .5em;
    }
    #menu>li:nth-of-type(2),
    #menu>li:nth-of-type(3),
    #menu>li:nth-of-type(4) {
      border-left: 1px solid white;
    }


    #menu li a {
      display: block;
      color: white;
      text-decoration: none;
    }
    [data-league="Central"] {
      --league-color: var(--central-league-green);
      background-color: var(--league-color);
    }
    [data-league="Pacific"] {
      --league-color: var(--pacific-league-blue);
      background-color: var(--league-color);
    }
    #menu li ul {
      list-style: none;
      display: flex;
      align-items: flex-end;
      margin: 0;
      padding: 0 0 0 .5em;
    }
    #menu li ul li{
      margin: 0;
      padding: 0;
    }
    #menu li li>a{
      padding: 0;
      text-align: center;
      width: 5em;
    }
    a {
      color: white;
      background-color: var(--team-color, gray);
    }
    </style>`;

    const html = `
    <ul id="menu">
    <li>NPB2022</li>
    <li>Standings
      <ul>
        <li><a href="../Central/standings" data-league="Central">Central</a></li>
        <li><a href="../Pacific/standings" data-league="Pacific">Pacific</a></li>
      </ul>
    </li>
    <li>Above .500
      <ul>
        <li><a href="../Central/above500" data-league="Central">Central</a></li>
        <li><a href="../Pacific/above500" data-league="Pacific">Pacific</a></li>
      </ul>
    </li>
    <li>Game Results
      <ul>
        <li><a class="Dragons" href="../Dragons/byDate">Dragons</a></li>
      </ul>
    </li>
  </ul>
  `;
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `${style}${html}`;

    const link_handler = (e) => {
      e.preventDefault();
      const pathname = new URL(e.target.href).pathname;
      document.querySelector("npb-router").setAttribute("pathname", pathname);
    };

    [
      ...this.shadowRoot.querySelectorAll(
        `a[href*="standings"],a[href*="above500"]`
      ),
    ].forEach((a) => {
      a.addEventListener("click", link_handler);
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {}

  connectedCallback() {
    this.render();
  }
}

export { NpbMenubar };
