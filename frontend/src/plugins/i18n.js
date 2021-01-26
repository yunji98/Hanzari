import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

const messages = {
    en: {
        "defaultErrorMsg": "Error has occurred"
    },
    ko: {
        //AssignSeats.vue
        "floor": "층",
        "resetRatio": "배율 및 도면위치 초기화",
        "btnSave": "저장",
        "btnSaving": "저장 중..",
        "btnSaveDone": "저장 완료",
        "tooltipSetOpacity": "전체 층에 있는 모든 자리의 불투명도 조절이 가능합니다.",
        "tooltipViewSeatInfo": "전체 층에 있는 모든 자리의 상세 정보를 변경할 수 있습니다.",
        "tooltipPanMode": "도면화면의 이동 잠금을 설정하거나 해제할 수 있습니다.",
        "tooltipDeleteAllBtn": "현재 층의 자리들을 전체 삭제할 수 있습니다.",
        "tooltipCaptureBtn": "현재 층의 도면 캡쳐",
        "tooltipPrintBtn": "현재 층의 도면화면과 자리 정보가 담긴 표를 인쇄할 수 있습니다.",
        "tooltipCSVBtn": "현재 건물에 저장된 모든 자리 정보가 담긴 csv 파일을 다운로드 및 수정 후 업로드할 수 있습니다.",
        "contextMenuDelete": "삭제하기",
        "contextMenuCopy": "복제하기",
        "contextMenuSeatSize": "자리 크기 조정하기",
        "contextMenuViewSeatAboutEmployeeName": "사원명",
        "contextMenuViewSeatAboutNumber": "내선번호",
        "contextMenuViewSeatAboutDepartment": "부서명",
        "contextMenuViewSeatAboutName": "자리명",
        "contextMenuDownloadCSV": "자리 정보 다운로드하기(CSV)",
        "contextMenuUploadCSV": "자리 정보 업로드 하기(CSV)",
        "alertNoObjectMoving": "자리가 움직였으므로 도면 잠금을 풀겠습니다.",
        "alertNoSelectedSeat": "선택된 자리가 없습니다.",
        "alertNoBackgroundImage": "도면 이미지가 없습니다.",
        "alertNoBackgroundImageOfTryToChangeFloor": "자리를 이동할 층의 도면 이미지가 없습니다.",
        "alertNoFloorNameOfTryToChangeFloor": "자리를 이동할 층의 이름을 설정해주세요.",
        "alertNoFloorName": "층 이름이 설정되지 않았습니다.",
        "confirmChangeMapper": "선택된 자리 중 {seatNames} 자리에 다른 사원이 매핑되었습니다.<br>변경하시겠습니까?",
        "confirmDeleteAll": "현재 층의 모든 자리를 삭제하시겠습니까?",
        "confirmDelete": "해당 자리를 삭제하시겠습니까?",
        "alertAlreadyEmptySeat": "이미 모두 비워져있는 자리입니다.",
        "confirmChangeSeatToVacant": "{seatNames} 자리를 비우시겠습니까?",
        "textEmptySeat": "공석",
        "toolTipText": "이름 : {employeeName} <br>아이디 : {employeeId} <br>부서 : {employeeDepartment} <br>내선번호 : {employeeNumber}",
        "alertMoveSeatToAnotherFloor": "이동할 자리가 선택되지 않았습니다.",
        "alertCanvasLockStatus": "도면화면 이동 잠금이 해제되었습니다.",
        "confirmUploadCSV": "{filename} 파일을 업로드하시겠습니까?",
        "confirmMoveSeatToAnotherFloor": "{floorName}층으로 이동하시겠습니까?",
        "seatName": "자리 이름",
        "floorSeatLayout": "{floorName}층 자리 배치도",
        "confirmSave": "저장하시겠습니까? 저장 완료 1초 뒤 새로고침 됩니다.",
        "confirmSaveBeforeChangeBuilding": "{buildingName}의 {floorName}으로 이동하시겠습니까? (건물 간 이동은 현재 건물에서 진행되던 작업을 저장한 후 가능합니다. 저장 완료 1초 뒤 새로고침 됩니다.)",

        "titleConfirmUploadCSV": "CSV 파일 업로드",
        "titleConfirmSave": "저장",
        "titleConfirmMoveSeatToAnotherFloor": "층간 자리이동",
        "titleConfirmSaveBeforeChangeBuilding": "건물간 자리이동",
        "titleConfirmChangeMapper": "다른 사원으로 자리매핑",
        "titleConfirmDeleteAll": "전체 자리 삭제",
        "titleConfirmDelete": "자리 삭제",
        "titleConfirmChangeSeatToVacant": "자리 비우기",
        "titleConfirmReset": "줌 비율 초기화",
        "titleConfirmAuthorize": "권한 변경",
        "titleConfirmLogout": "로그아웃",

        //AuthorizeEmployee.vue
        "textFieldLabelSearchEmployee": "사원의 정보를 검색하세요.",
        "dataTabelNoDataTextEmployee": "사원 데이터가 없습니다.",
        "dataTabelPerPageTextEmployee": "페이지 당 사원수",
        "btnCancel": "취소",
        "textName": "이름",
        "textDept": "부서",
        "textNumber": "내선번호",
        "textSeatType": "비고",
        "textVacantSeat": "공석",
        "contextAdmin": "관리자",
        "contextManager": "매니저",
        "contextViewer": "뷰어",
        "alertNoSelectedEmployee": "선택된 사원이 없습니다.",
        "alertNoChangeAuthorityByOneSelf": "본인의 권한은 직접 부여할 수 없습니다.",
        "alertSuccessChangeAuthroity": "사원 권한 부여 성공",
        "confirmReset": "초기화하시겠습니까?",
        "confirmAuthorize": "권한 변경하시겠습니까?",
        "alertRemoveCheckRightTable": "우측 테이블에 체크를 해제해야합니다.",
        "alertRemoveCheckLeftTable": "좌측 테이블에 체크를 해제해야합니다.",

        //BuildingSetting.vue
        "inputBuildingName": "건물명 입력",
        "textInputBuildingName": "새로 생성할 건물명을 입력하세요.",

        //EditPassword.vue
        "textEditPassword": "비밀번호 변경",
        "alertNoInputOldPassword": "현재 비밀번호를 입력해야합니다.",
        "alertNoInputNewPassword": "새 비밀번호를 입력해야합니다.",
        "alertSamePreviousPassword": "현재 비밀번호와 동일합니다.",
        "alertSuccessEditPassword": "비밀번호 변경 성공",
        "errorChangePassword": "현재 비밀번호와 동일하지 않습니다.",
        "textFieldLabelPreviousPw": "현재 비밀번호",
        "textFieldLabelChangePw": "새 비밀번호",
        "textFieldLabelChangePwCompare": "새 비밀번호 확인",

        //FlowInformationTable.vue
        "headersDivision": "구분",
        "headersNumberOfSeat": "자리 수",
        "textAllSeat": "전체",

        //ManageFloors.vue
        "textBuildingName": "건물 이름",
        "textSelectFloor": "층 선택",
        "textSettingFloor": "층 설정",
        "btnConfirm": "확인",
        "textSettingImage": "도면 이미지 설정",
        "btnUploadImage": "업로드",
        "textUploadImage": "이미지를 업로드하세요.",
        "alertNoFloorOnImage": "도면을 올릴 층이 없습니다.",
        "textFieldLabelEditFloorName": "층 이름을 수정하세요.",
        "tooltipFloorSettingBtn": "층 추가, 삭제, 층 이름 수정이 가능합니다.",

        //ManageSearch.vue
        "textFieldLabelSearchSeat": "이름/부서/내선번호 중 입력하세요.",
        "dataTabelNoDataTextSeat": "자리에 매핑된 사원 데이터가 없습니다.",
        "dataTabelPerPageTextSeat": "페이지 당 자리수",
        "searchEmployee": "사원 자리 검색",
        "findSeat": "찾기",

        //ManageSeats.vue
        "textMakeSeat": "자리 만들기",
        "textInformationOfSeat": "자리 상세정보",
        "textOpactiyOfSeat": "자리 불투명도",
        "tooltipAddSeatSwitch": "스위치를 켜면 선택한 자리의 개수만큼 도면화면 위에 드래그하여 자리 생성이 가능합니다.",
        "btnMappingEmployee": "사원 매핑하기",
        "btnChangeToVacant": "자리 비우기",
        "btnDeleteAllSeats": "자리 전체 삭제하기",
        "btnOk": "확인",
        "textChangeFloorSeat": "층간 이동하기",
        "alertNoSelectFloor": "이동할 층을 선택하지 않았습니다.",
        "alertNoSelectBuildingFloor": "이동할 건물의 층을 선택하지 않았습니다.",
        "alertNoImage": "해당 건물 층에 이미지가 없습니다.",
        "textChangeBuildingSeat": "건물간 이동하기",
        "textMemoToSeat": "메모 작성하기",
        "textInMemoTextArea": "자리에 남기고자 하는 메모를 입력하세요.",
        "selectLabelNumberSeat": "자리 개수",
        "selectLabelFloor": "이동할 층을 선택하세요.",
        "selectLabelBuilding": "이동할 건물의 층을 선택하세요.",
        "selectNoDataFloor": "이동할 층이 없습니다.",
        "selectNoDataBuilding": "이동할 건물이 없습니다.",
        "reorderSeatName": "자리명 재정렬",
        "reorder": "재정렬하기",
        "mapping": "매핑하기",

        //ProgressDialog.vue
        "loadingData": "데이터 로딩중..",

        //Hanzari.vue
        "btnOK": "확인",
        "backToMyPage": "마이페이지",
        "confirmLogout": "로그아웃 하시겠습니까?",
        "logout": "로그아웃",
        "user": "님",
        "projectName": "한자리",
        "confirmNotSaveWork": "저장되지 않은 작업이 있습니다.<br>그래도 마이페이지로 이동하시겠습니까?",
        "titleOfCSVErrorConfirmDialog": "CSV 업로드 오류",
        "titleConfirmNotSaveWork": "마이페이지로 이동하기",

        "errorMessageWhenSeatIdIsNullWithSeatName": "자리명이 {seatNameFromCSV}인 자리의 아이디를 입력하지 않았습니다.",
        "errorMessageWhenSeatIdIsNullWithoutSeatName": "자리 아이디를 입력하지 않은 자리가 있습니다.",
        "errorMessageWhenSeatIdNotExistWithSeatName": "자리명이 {seatNameFromCSV}인 자리의 아이디를 존재하지 않는 아이디로 입력하였습니다.",
        "errorMessageWhenSeatIdNotExistWithoutSeatName": "자리 아이디를 존재하지 않는 아이디로 입력한 자리가 있습니다.",
        "errorMessageWhenEmployeeIdNotExistWithSeatName": "자리명이 {seatNameFromCSV}인 자리를 존재하지 않는 사원의 아이디로 입력하였습니다.",
        "errorMessageWhenEmployeeIdNotExistWithoutSeatName": "존재하지 않는 사원의 아이디로 입력한 자리가 있습니다.",

        "errorMessageWhenFailedObjectsAreMany":
            "자리 아이디를 입력하지 않은 자리 {numberOfSeatIdIsNullText}개 : {seatNameOfSeatIdIsNullText}<br>존재하지 않은 자리아이디를 입력한 자리 {numberOfSeatIsNotExistText}개 : {seatNameOfSeatIsNotExistText}<br>존재하지 않은 사원아이디를 입력한 자리 {numberOfEmployeeIsNotExistText}개 : {seatNameOfEmployeeIsNotExistText}",

        //Login.vue
        "projectLogin": "한자리 로그인",
        "login": "로그인",
        "employeeId": "사번",
        "password": "비밀번호",
        "alertErrorLogin": "가입하지 않은 아이디이거나, 잘못된 비밀번호입니다.",
        "employeeIdExample": "1012345",

        //AdminMyPage.vue
        "projectMypage": "한자리 마이페이지",
        "createNewBuilding": "새 건물 생성",
        "changeMemberInformation": "비밀번호 변경",
        "grantAuthority": "권한 변경",
        "contextMenuDeleteBuilding": "건물 삭제",
        "contextMenuEditBuildingName": "건물명 변경",
        "titleConfirmDeleteBuilding": "건물 삭제하기",
        "confirmDeleteBuilding": "{buildingName} 건물을 삭제하시겠습니까?",
        "titleConfirmChangeBuildingName": "건물명 변경하기",
        "promptChangeBuildingName": "'{buildingName}'에서 변경할 건물명을 입력하세요.",

        //ViewerManageFloors.vue
        "buildingName": "건물이름",
        "selectFloor": "층 선택",
        "floorName": "층 이름",

        //SuperHanzari.vue
        "authorityViewer": "뷰어",
        "authorityAdmin": "관리자",
        "authorityManager": "매니저",
        "superMypageTitle": "한자리 권한변경",
        "btnMoveEmployeeToRightDataTable": ">>이동",
        "btnMoveEmployeeToLeftDataTable": "<<이동",
        "btnResetAuthorizeEmployee": "초기화",
        "alertSuccessChangeEmployeeAuthority" : "권한 변경에 성공하였습니다.",

        //Tabs.vue
        "settingSeat": "자리 설정",
        "search": "검색",
    }
}


export const i18n = new VueI18n({
    locale: 'ko',
    fallbackLocale: 'en',
    messages,
})
