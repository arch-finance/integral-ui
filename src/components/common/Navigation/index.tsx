import { NavLink, matchPath, useLocation } from "react-router-dom";

const PATHS = {
    SWAP: '/swap',
    LIMIT_ORDERS: 'limit-order',
    POOLS: '/pools'
}

const menuItems = [
    {
        title: 'Swap',
        link: '/swap',
        active: [PATHS.SWAP]
    },
    {
        title: 'Limit Order',
        link: '/limit-order',
        active: [PATHS.LIMIT_ORDERS]
    },
    {
        title: 'Pools',
        link: '/pools',
        active: [PATHS.POOLS]
    }
]

const Navigation = () => {

    const { pathname } = useLocation()

    const setNavlinkClasses = (paths: string[]) => paths.some((path) => matchPath(path, pathname)) ? "text-[#56adff] bg-[#0a2b49]" : "hover:bg-card-hover";

    return <nav>
        <ul className="flex justify-center gap-1 rounded-full">
            {
                menuItems.map((item) => <NavLink
                    key={`nav-item-${item.link}`}
                    to={item.link}
                    className={`${setNavlinkClasses(item.active)} py-2 px-4 rounded-3xl`}
                >{item.title}</NavLink>)
            }
        </ul>
    </nav>

}

export default Navigation;