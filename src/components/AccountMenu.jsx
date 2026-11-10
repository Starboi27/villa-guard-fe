import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  Separator,
} from "react-aria-components";
import { useNavigate } from "react-router";
import { Icon } from "./Icon.jsx";
import styles from "./AccountMenu.module.css";

export function AccountMenu({ user, onSignOut }) {
  const navigate = useNavigate();

  return (
    <MenuTrigger>
      <Button className={styles.trigger} aria-label="내 정보 메뉴">
        <span className={styles.avatar}>
          <Icon name="user" size={16} />
        </span>
        <span>내 정보</span>
        <span className={styles.chevron}>
          <Icon name="chevron" size={14} />
        </span>
      </Button>
      <Popover className={styles.popover} placement="bottom end" offset={8}>
        <div className={styles.account}>
          <p className={styles.accountLabel}>내 계정</p>
          <strong>{user.login_id}</strong>
          <p className={styles.unit}>
            {user.unit
              ? `${user.unit.building_name} · ${user.unit.name}`
              : "연결된 세대가 없어요"}
          </p>
        </div>
        <Menu aria-label="내 정보 메뉴" className={styles.menu}>
          <MenuItem
            textValue="텔레그램 알림 설정"
            className={styles.item}
            onAction={() => navigate("/settings/telegram")}
          >
            <Icon name="bell" size={18} />
            <span>텔레그램 알림 설정</span>
            <span className={styles.itemChevron}>
              <Icon name="chevron" size={15} />
            </span>
          </MenuItem>
          <Separator className={styles.separator} />
          <MenuItem
            textValue="로그아웃"
            className={styles.item}
            onAction={onSignOut}
          >
            <Icon name="logout" size={18} />
            <span>로그아웃</span>
          </MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
